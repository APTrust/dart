package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"fmt"
	"io"
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
	getLinks := flag.String("get-links", "", "Get public download links for a specific version (e.g. beta-03)")
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

	success := true
	if *makeFolders {
		if *version == "" {
			log.Fatal("-version is required for -make-folders")
		}
		success = doMakeFolders(s3Client, *version)
	} else if *upload {
		if *version == "" || *arch == "" {
			log.Fatal("-version and -arch are required for -upload")
		}
		args := flag.Args()
		if len(args) < 1 {
			log.Fatal("Please provide the path to the file to upload")
		}
		filePath := args[0]
		success = doUpload(s3Client, *version, *arch, filePath)
	} else if *list {
		if *prefix == "" {
			log.Fatal("-prefix is required for -list")
		}
		success = doList(s3Client, *prefix)
	} else if *getLinks != "" {
		success = doGetLinks(s3Client, *getLinks)
	} else {
		fmt.Println("Please specify an action: -make-folders, -upload, -list, or -get-links")
		flag.Usage()
		success = false
	}

	if !success {
		os.Exit(1)
	}
}

func doMakeFolders(client *minio.Client, version string) bool {
	ctx := context.Background()
	arches := []string{"linux-amd64", "mac-universal", "windows-amd64"}
	success := true

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
			success = false
		} else {
			fmt.Printf("Successfully created folder: %s/%s\n", Bucket, folderPath)
		}
	}
	return success
}

func doUpload(client *minio.Client, version, arch, filePath string) bool {
	ctx := context.Background()
	fileName := filepath.Base(filePath)
	objectName := fmt.Sprintf("%s/%s/%s/%s", KeyPrefix, version, arch, fileName)

	// Calculate SHA256 checksum
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Printf("Failed to open %s for checksum calculation: %v\n", filePath, err)
		return false
	}

	h := sha256.New()
	if _, err := io.Copy(h, file); err != nil {
		fmt.Printf("Failed to calculate SHA256 for %s: %v\n", filePath, err)
		file.Close()
		return false
	}
	file.Close()

	checksum := hex.EncodeToString(h.Sum(nil))

	contentType := "application/octet-stream"

	_, err = client.FPutObject(ctx, Bucket, objectName, filePath, minio.PutObjectOptions{
		ContentType: contentType,
		UserMetadata: map[string]string{
			"x-amz-acl":         "public-read",
			"x-amz-meta-sha256": checksum,
		},
	})

	if err != nil {
		fmt.Printf("Failed to upload %s to %s/%s: %v\n", filePath, Bucket, objectName, err)
		return false
	} else {
		fmt.Printf("Successfully uploaded %s to %s/%s\n", filePath, Bucket, objectName)
		return true
	}
}

func doList(client *minio.Client, prefix string) bool {
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
			return false
		}
		// Note: S3 tracks LastModified natively. It does not track a separate creation date
		// unless you use versioning. We use LastModified as the standard timestamp here.
		dateStr := object.LastModified.Format("2006-01-02 15:04:05 MST")
		fmt.Printf("%-24s %-15d %s\n", dateStr, object.Size, object.Key)
	}
	return true
}

func doGetLinks(client *minio.Client, version string) bool {
	ctx := context.Background()
	prefix := fmt.Sprintf("%s/%s", KeyPrefix, version)

	listOptions := minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	}

	fmt.Printf("%-24s %-15s %-64s %s\n", "Last Updated", "Size (bytes)", "SHA256 Checksum", "Download Link")
	fmt.Printf("%-24s %-15s %-64s %s\n", strings.Repeat("-", 24), strings.Repeat("-", 15), strings.Repeat("-", 64), strings.Repeat("-", 15))

	for object := range client.ListObjects(ctx, Bucket, listOptions) {
		if object.Err != nil {
			fmt.Printf("List Error: %v\n", object.Err)
			return false
		}
		if object.Size > 0 {
			link := fmt.Sprintf("https://%s/%s/%s", Endpoint, Bucket, object.Key)

			// Call StatObject to retrieve user metadata
			objInfo, err := client.StatObject(ctx, Bucket, object.Key, minio.StatObjectOptions{})
			checksum := "N/A"
			if err == nil {
				// UserMetadata keys might be stripped of "x-amz-meta-" by minio-go
				// or they might preserve the casing depending on how it was uploaded.
				if val, ok := objInfo.UserMetadata["Sha256"]; ok && val != "" {
					checksum = val
				} else if val, ok := objInfo.UserMetadata["x-amz-meta-sha256"]; ok && val != "" {
					checksum = val
				} else if val, ok := objInfo.UserMetadata["X-Amz-Meta-Sha256"]; ok && val != "" {
					checksum = val
				} else {
					// Fallback to Metadata map
					val = objInfo.Metadata.Get("X-Amz-Meta-Sha256")
					if val == "" {
						val = objInfo.Metadata.Get("x-amz-meta-x-amz-meta-sha256")
					}
					if val != "" {
						checksum = val
					}
				}
			}

			dateStr := object.LastModified.Format("2006-01-02 15:04:05 MST")
			fmt.Printf("%-24s %-15d %-64s %s\n", dateStr, object.Size, checksum, link)
		}
	}
	return true
}
