package main

import (
	"log/slog"

	"github.com/picosh/pdocs"
)

func main() {
	pager := pdocs.Pager("./posts")
	sitemap := &pdocs.Sitemap{
		Children: []*pdocs.Sitemap{
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
			},
			{
				Text: "Controllers",
				Children: []*pdocs.Sitemap{
					{
						Text: "Overview",
						Href: "/controllers",
						Page: pager("controllers.md"),
					},
					{
						Text: "Thunks",
						Href: "/thunks",
						Page: pager("thunks.md"),
					},
					{
						Text: "Endpoints",
						Href: "/endpoints",
						Page: pager("endpoints.md"),
					},
				},
			},
			{
				Text: "Models",
				Children: []*pdocs.Sitemap{
					{

						Text: "Overview",
						Href: "/models",
						Page: pager("models.md"),
					},
					{

						Text: "Store",
						Href: "/store",
						Page: pager("store.md"),
					},
					{
						Text: "Schema",
						Href: "/schema",
						Page: pager("schema.md"),
					},
				},
			},
			{
				Text: "React",
				Href: "/react",
				Page: pager("react.md"),
			},
			{
				Text: "Caching",
				Href: "/caching",
				Page: pager("caching.md"),
			},
			{
				Text: "Dependent Queries",
				Href: "/dependent-queries",
				Page: pager("dependent.md"),
			},
			{
				Text: "Middleware",
				Href: "/middleware",
				Page: pager("mdw.md"),
			},
			{
				Text: "Loaders",
				Href: "/loaders",
				Page: pager("loader.md"),
			},
			{
				Text: "Structured Concurrency",
				Href: "/structured-concurrency",
				Page: pager("structured-concurrency.md"),
			},
			{
				Text: "Supervisors",
				Href: "/supervisors",
				Page: pager("supervisors.md"),
			},
			{
				Text: "Testing",
				Href: "/testing",
				Page: pager("testing.md"),
			},
			{
				Text: "Design Philosophy",
				Href: "/design-philosophy",
				Page: pager("design-philosophy.md"),
			},
			{
				Text: "API",
				Href: "/api",
				Page: pager("api.md"),
			},
			{
				Text: "Resources",
				Href: "/resources",
				Page: pager("resources.md"),
			},
		},
	}

	logger := slog.Default()
	config := &pdocs.DocConfig{
		Logger:   logger,
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
