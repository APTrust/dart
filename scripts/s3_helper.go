package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const (
	Bucket    = "aptrust.public.download"
	KeyPrefix = "dart3"
	Endpoint  = "s3.amazonaws.com"
)

func main() {
	makeFolders := flag.Bool("make-folders", false, "Create S3 folders")
	upload := flag.Bool("upload", false, "Upload file to S3")
	list := flag.Bool("list", false, "List S3 items")
	version := flag.String("version", "", "DART version (e.g. beta-03)")
	arch := flag.String("arch", "", "Architecture (e.g. linux-amd64, mac-universal, windows-amd64)")
	prefix := flag.String("prefix", "", "Prefix for list command")

	flag.Parse()

	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	if accessKey == "" || secretKey == "" {
		log.Fatal("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in the environment")
	}

	s3Client, err := minio.New(Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: true,
	})
	if err != nil {
		log.Fatalf("Error creating S3 client: %v", err)
	}

	if *makeFolders {
		if *version == "" {
			log.Fatal("-version is required for -make-folders")
		}
		doMakeFolders(s3Client, *version)
	} else if *upload {
		if *version == "" || *arch == "" {
			log.Fatal("-version and -arch are required for -upload")
		}
		args := flag.Args()
		if len(args) < 1 {
			log.Fatal("Please provide the path to the file to upload")
		}
		filePath := args[0]
		doUpload(s3Client, *version, *arch, filePath)
	} else if *list {
		if *prefix == "" {
			log.Fatal("-prefix is required for -list")
		}
		doList(s3Client, *prefix)
	} else {
		fmt.Println("Please specify an action: -make-folders, -upload, or -list")
		flag.Usage()
	}
}

func doMakeFolders(client *minio.Client, version string) {
	ctx := context.Background()
	arches := []string{"linux-amd64", "mac-universal", "windows-amd64"}

	for _, a := range arches {
		folderPath := fmt.Sprintf("%s/%s/%s/", KeyPrefix, version, a)

		_, err := client.StatObject(ctx, Bucket, folderPath, minio.StatObjectOptions{})
		if err == nil {
			fmt.Printf("Folder already exists: %s/%s\n", Bucket, folderPath)
			continue
		}

		emptyContent := bytes.NewReader([]byte{})
		_, err = client.PutObject(ctx, Bucket, folderPath, emptyContent, 0, minio.PutObjectOptions{
			UserMetadata: map[string]string{"x-amz-acl": "public-read"},
		})

		if err != nil {
			fmt.Printf("Failed to create folder %s/%s: %v\n", Bucket, folderPath, err)
		} else {
			fmt.Printf("Successfully created folder: %s/%s\n", Bucket, folderPath)
		}
	}
}

func doUpload(client *minio.Client, version, arch, filePath string) {
	ctx := context.Background()
	fileName := filepath.Base(filePath)
	objectName := fmt.Sprintf("%s/%s/%s/%s", KeyPrefix, version, arch, fileName)

	contentType := "application/octet-stream"

	_, err := client.FPutObject(ctx, Bucket, objectName, filePath, minio.PutObjectOptions{
		ContentType:  contentType,
		UserMetadata: map[string]string{"x-amz-acl": "public-read"},
	})
	if err != nil {
		fmt.Printf("Failed to upload %s to %s/%s: %v\n", filePath, Bucket, objectName, err)
	} else {
		fmt.Printf("Successfully uploaded %s to %s/%s\n", filePath, Bucket, objectName)
	}
}

func doList(client *minio.Client, prefix string) {
	ctx := context.Background()

	listOptions := minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	}

	fmt.Printf("%-24s %-15s %s\n", "Last Updated", "Size (bytes)", "Object Name")
	fmt.Printf("%-24s %-15s %s\n", strings.Repeat("-", 24), strings.Repeat("-", 15), strings.Repeat("-", 30))

	for object := range client.ListObjects(ctx, Bucket, listOptions) {
		if object.Err != nil {
			fmt.Printf("List Error: %v\n", object.Err)
			return
		}
		// Note: S3 tracks LastModified natively. It does not track a separate creation date
		// unless you use versioning. We use LastModified as the standard timestamp here.
		dateStr := object.LastModified.Format("2006-01-02 15:04:05 MST")
		fmt.Printf("%-24s %-15d %s\n", dateStr, object.Size, object.Key)
	}
}
