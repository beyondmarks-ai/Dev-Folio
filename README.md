# DevFolio Gallery

DevFolio Gallery is a fast, responsive directory for discovering developer portfolio websites. It turns a large JSON dataset into a visual browsing experience with search, specialty filters, sorting, saved items, and resilient website previews.

## Features

- Visual portfolio cards in a responsive four-column desktop grid
- Search by name, role, or specialty
- Category filters for frontend, full stack, backend, mobile, design, and AI
- Featured, alphabetical, and shuffled sorting
- Saved portfolios stored locally in the browser
- Random portfolio discovery
- Lazy-loaded previews with polished fallbacks for unavailable screenshots
- Keyboard navigation, visible focus states, reduced-motion support, and semantic HTML
- Dependency-free static deployment

## Tech stack

- HTML5
- Modern CSS
- Vanilla JavaScript
- JSON data source
- GitHub Pages

## Run locally

No package installation or build step is required.

~~~bash
python -m http.server 8000
~~~

Open http://localhost:8000.

If Python is unavailable, any static file server can serve the repository root.

## Project structure

~~~text
.
|-- .github/workflows/pages.yml
|-- assets/
|   -- which-portfolio-to-choose-v2.png
|-- app.js
|-- feed.json
|-- index.html
|-- styles.css
-- README.md
~~~

## Portfolio data

Portfolio records live in feed.json:

~~~json
{
  "name": "Developer name",
  "url": "https://portfolio.example",
  "tagline": "Frontend Engineer"
}
~~~

The name and url fields are required. tagline is optional. The interface reads this file at runtime, so keep it valid JSON and serve the project over HTTP rather than opening index.html directly.

## Deployment

The included GitHub Actions workflow deploys the repository root to GitHub Pages.

1. Push the project to a GitHub repository.
2. Open **Settings -> Pages**.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Push to main, or run the workflow manually.

## Quality checks

Before pushing:

~~~bash
node --check app.js
python -m json.tool feed.json > NUL
git diff --check
~~~

On macOS or Linux, replace NUL with /dev/null.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project workflow and submission standards.

## Maintainer

Rakesh Kumar
