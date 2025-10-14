package controllers

import (
	"fmt"
	"net/url"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Pager struct {
	TotalItems       int
	ItemsInResultSet int
	ItemFirst        int
	ItemLast         int
	Page             int
	PerPage          int
	QueryOffset      int
	PreviousLink     string
	NextLink         string
	URL              *url.URL
}

func NewPager(c *gin.Context, baseURL string, defaultPerPage int) (*Pager, error) {
	_baseURL, err := url.Parse(baseURL)
	if err != nil {
		return nil, err
	}
	pager := &Pager{
		URL: _baseURL,
	}
	page := c.DefaultQuery("page", "1")
	perPage := c.DefaultQuery("per_page", strconv.Itoa(defaultPerPage))
	pager.Page, _ = strconv.Atoi(page)
	pager.PerPage, _ = strconv.Atoi(perPage)
	if pager.Page > 1 {
		pager.QueryOffset = (pager.Page - 1) * pager.PerPage
	}
	// Do not let users request hundreds of thousands of items at once.
	if pager.PerPage > 1000 {
		pager.PerPage = 1000
	}
	pager.ItemFirst = pager.QueryOffset + 1
	return pager, nil
}

func (pager *Pager) SetCounts(totalItems, itemsInResultSet int) {
	pager.TotalItems = totalItems
	pager.ItemsInResultSet = itemsInResultSet
	pager.ItemLast = pager.QueryOffset + itemsInResultSet

	if pager.TotalItems == 0 {
		pager.ItemFirst = 0
	}

	queryValues := pager.URL.Query()
	queryValues["per_page"] = []string{strconv.Itoa(pager.PerPage)}
	if pager.Page > 1 {
		queryValues["page"] = []string{strconv.Itoa(pager.Page - 1)}
		pager.PreviousLink = fmt.Sprintf("%s?%s", pager.URL.Path, queryValues.Encode())
	}

	if totalItems > pager.ItemLast {
		queryValues["page"] = []string{strconv.Itoa(pager.Page + 1)}
		pager.NextLink = fmt.Sprintf("%s?%s", pager.URL.Path, queryValues.Encode())
	}
}
