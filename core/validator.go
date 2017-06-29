package core

type Validator struct {
	Bag         Bag
	Profile     BagProfile
	Errors      []string
	bagsize     int64
	payloadOxum string
}

func NewValidator(bag *Bag, profile *BagItProfile) *Validator {
	return &Validator{
		Bag:     bag,
		Profile: profile,
	}
}

func Validate() bool {

}
