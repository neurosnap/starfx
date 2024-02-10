package main

import (
	"github.com/picosh/pdocs"
)

func main() {
	pager := pdocs.Pager("./posts")
	sitemap := []*pdocs.Sitemap{
		{
			Text: "Home",
			Href: "/",
			Page: pager("home.md"),
		},
		{
			Text: "Sitemap",
			Href: "/sitemap",
			Page: pager("sitemap.md"),
		},
		{
			Text: "Getting started",
			Href: "/getting-started",
			Page: pager("getting-started.md"),
			Tag:  "Help",
		},
	}

	config := &pdocs.DocConfig{
		Sitemap:  sitemap,
		Out:      "./public",
		Tmpl:     "./tmpl",
		PageTmpl: "post.page.tmpl",
	}

	err := config.GenSite()
	if err != nil {
		panic(err)
	}
}
