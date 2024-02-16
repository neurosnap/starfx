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
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Design Philosophy"),
				pdocs.AnchorTagSitemap("The Simplest Example"),
				pdocs.AnchorTagSitemap("Effection"),
			},
		},
		{
			Text: "Thunks",
			Href: "/thunks",
			Page: pager("thunks.md"),
			Tag:  "Side Effects",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Thunk Action"),
				pdocs.AnchorTagSitemap("Thunk Payload"),
				pdocs.AnchorTagSitemap("Custom ctx"),
			},
		},
		{
			Text: "Endpoints",
			Href: "/endpoints",
			Page: pager("endpoints.md"),
			Tag:  "Side Effects",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Enforcing fetch response type"),
				pdocs.AnchorTagSitemap("The same API endpoints but different logic"),
				pdocs.AnchorTagSitemap("Using variables inside the API endpoint"),
				pdocs.AnchorTagSitemap("ctx.request"),
				pdocs.AnchorTagSitemap("Using ctx.req"),
				pdocs.AnchorTagSitemap("ctx.response"),
				pdocs.AnchorTagSitemap("ctx.json"),
				pdocs.AnchorTagSitemap("Middleware automation"),
			},
		},
		{
			Text: "Store",
			Href: "/store",
			Page: pager("store.md"),
			Tag:  "Store",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("How to update state"),
				pdocs.AnchorTagSitemap("Updating state from view"),
			},
		},
		{
			Text: "React",
			Href: "/react",
			Page: pager("react.md"),
			Tag:  "View",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("useSelector"),
				pdocs.AnchorTagSitemap("useLoader"),
				pdocs.AnchorTagSitemap("useApi"),
				pdocs.AnchorTagSitemap("useQuery"),
				pdocs.AnchorTagSitemap("useCache"),
				pdocs.AnchorTagSitemap("useLoaderSuccess"),
			},
		},
		{
			Text: "Schema",
			Href: "/schema",
			Page: pager("schema.md"),
			Tag:  "Store",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Schema Assumptions"),
				pdocs.AnchorTagSitemap("any"),
				pdocs.AnchorTagSitemap("str"),
				pdocs.AnchorTagSitemap("num"),
				pdocs.AnchorTagSitemap("obj"),
				pdocs.AnchorTagSitemap("table"),
				pdocs.AnchorTagSitemap("loader"),
				pdocs.AnchorTagSitemap("Build your own slice"),
			},
		},
		{
			Text: "Caching",
			Href: "/caching",
			Page: pager("caching.md"),
			Tag:  "Store",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Manual"),
				pdocs.AnchorTagSitemap("Automatic"),
			},
		},
		{
			Text: "Dependent Queries",
			Href: "/dependent-queries",
			Page: pager("dependent.md"),
			Tag:  "Side Effects",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Dispatch the thunk as an action"),
				pdocs.AnchorTagSitemap("Call the middleware stack directly"),
			},
		},
		{
			Text: "Middleware",
			Href: "/middleware",
			Page: pager("mdw.md"),
			Tag:  "Side Effects",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Context"),
			},
		},
		{
			Text: "Loaders",
			Href: "/loaders",
			Page: pager("loader.md"),
			Tag:  "Side Effects",
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Usage"),
				pdocs.AnchorTagSitemap("Shape"),
			},
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
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("poll"),
				pdocs.AnchorTagSitemap("timer"),
			},
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
			Children: []*pdocs.Sitemap {
				pdocs.AnchorTagSitemap("Quick Links"),
				pdocs.AnchorTagSitemap("Talk"),
				pdocs.AnchorTagSitemap("Other Notable Libraries"),
			},
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
