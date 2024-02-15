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
			Tag:  "Info",
		},
		{
			Text: "Thunks",
			Href: "/thunks",
			Page: pager("thunks.md"),
			Tag:  "Side Effects",
		},
		{
			Text: "Endpoints",
			Href: "/endpoints",
			Page: pager("endpoints.md"),
			Tag:  "Side Effects",
		},
		{
			Text: "Store",
			Href: "/store",
			Page: pager("store.md"),
			Tag:  "Store",
		},
		{
			Text: "React",
			Href: "/react",
			Page: pager("react.md"),
			Tag:  "View",
		},
		{
			Text: "Schema",
			Href: "/schema",
			Page: pager("schema.md"),
			Tag:  "Store",
		},
		{
			Text: "Caching",
			Href: "/caching",
			Page: pager("caching.md"),
			Tag:  "Store",
		},
		{
			Text: "Dependent Queries",
			Href: "/dependent-queries",
			Page: pager("dependent.md"),
			Tag:  "Side Effects",
		},
		{
			Text: "Middleware",
			Href: "/middleware",
			Page: pager("mdw.md"),
			Tag:  "Side Effects",
		},
		{
			Text: "Loaders",
			Href: "/loaders",
			Page: pager("loader.md"),
			Tag:  "Side Effects",
		},
		{
			Text: "Structured Concurrency",
			Href: "/structured-concurrency",
			Page: pager("structured-concurrency.md"),
			Tag:  "Info",
		},
		{
			Text: "Supervisors",
			Href: "/supervisors",
			Page: pager("supervisors.md"),
			Tag:  "Advanced",
		},
		{
			Text: "Testing",
			Href: "/testing",
			Page: pager("testing.md"),
			Tag:  "Advanced",
		},
		{
			Text: "API",
			Href: "/api",
			Page: pager("api.md"),
			Tag:  "Info",
		},
		{
			Text: "Resources",
			Href: "/resources",
			Page: pager("resources.md"),
			Tag:  "Info",
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
