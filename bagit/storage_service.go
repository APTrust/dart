package bagit

type StorageService struct {
	Id            string `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	Protocol      string `json:"protocol"`
	URL           string `json:"url"`
	Bucket        string `json:"bucket"`
	LoginName     string `json:"loginName"`
	LoginPassword string `json:"loginPassword"`
	LoginExtra    string `json:"loginExtra"`
}
