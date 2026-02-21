# GitHub Repository Stats Widget - Design Document

## Overview

A widget that displays comprehensive GitHub statistics across all active repositories in a user's account, including repository stats, recent activity, CI/CD status, pull requests, and issues.

---

## Requirements

### Platform
- **GitHub only** (via GitHub REST API v3 and GraphQL API v4)

### Authentication
- **Personal Access Token (PAT)** - Required for private repos and higher rate limits
- Token scopes needed: `repo`, `read:org` (if org repos desired), `workflow` (for CI status)

### Scope
- **All active repositories** in the authenticated user's account
- Option to filter by: owned repos, org repos, or specific repos

### Refresh Rate
- **1 hour default** (3600000ms)
- Configurable: 30 min, 1 hour, 2 hours, 4 hours
- Manual refresh button available

---

## Data to Display

### 1. Account Summary (Header)
| Field | Description |
|-------|-------------|
| Username/Avatar | GitHub username and profile picture |
| Total Repos | Count of active repositories |
| Last Checked | When data was last fetched |

### 2. Repository-Level Stats (Aggregated)
| Field | Description |
|-------|-------------|
| Total Stars | Sum of stars across all repos |
| Total Forks | Sum of forks across all repos |
| Total Watchers | Sum of watchers across all repos |
| Open Issues | Total open issues across all repos |
| Open PRs | Total open pull requests across all repos |

### 3. Recent Activity
| Field | Description |
|-------|-------------|
| Last Commit | Date/time of most recent commit (any repo) |
| Commits (7 days) | Total commits in last 7 days |
| Commits (30 days) | Total commits in last 30 days |
| Recent Commits | List of 3-5 most recent commit messages with repo name |

### 4. CI/CD Status
| Field | Description |
|-------|-------------|
| Passing | Count of repos with passing CI |
| Failing | Count of repos with failing CI |
| No CI | Count of repos without workflows |
| Failed Repos | List repos with failing CI (expandable) |

### 5. Pull Requests
| Field | Description |
|-------|-------------|
| Open PRs | Total open PRs across all repos |
| Awaiting Review | PRs where user is requested reviewer |
| Your PRs | PRs authored by the user |
| Recent PRs | List of 3-5 most recent open PRs |

### 6. Issues
| Field | Description |
|-------|-------------|
| Open Issues | Total open issues across all repos |
| Assigned to You | Issues assigned to the authenticated user |
| Recently Opened | Issues opened in last 7 days |
| Recent Issues | List of 3-5 most recent open issues |

---

## Visual Design

### Layout: Aggregated + Expandable Details

The widget shows aggregated stats with clickable boxes that open a modal/drawer with per-repo breakdown.

**Main Widget View (Compact)**
```
┌─────────────────────────────────────────────────────────┐
│  🐙 GitHub Stats (23 repos)       Last checked: 5m ago  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ ⭐ 234  │ │ 🍴 56   │ │ 📋 12   │ │ 🔀 8    │       │
│  │ Stars   │ │ Forks   │ │ Issues  │ │ PRs     │       │
│  │ (click) │ │ (click) │ │ (click) │ │ (click) │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ ✅ 15   │ │ ❌ 2    │ │ 📝 47   │ │ 👁️ 89   │       │
│  │ CI Pass │ │ CI Fail │ │ Commits │ │ Watchers│       │
│  │ (click) │ │ (click) │ │ (7 days)│ │ (click) │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
│  Recent: fix: resolve login bug (my-app) - 2h ago      │
│          feat: add API endpoint (backend) - 5h ago     │
└─────────────────────────────────────────────────────────┘
```

**Expanded Modal View (on click)**

When user clicks a stat box (e.g., "12 Issues"), a modal opens:

```
┌─────────────────────────────────────────────────────────┐
│  📋 Open Issues (12 total)                         [X]  │
├─────────────────────────────────────────────────────────┤
│  Repository          Issues    Link                     │
│  ─────────────────────────────────────────────────────  │
│  my-app              5         [View on GitHub →]       │
│  backend             4         [View on GitHub →]       │
│  docs                2         [View on GitHub →]       │
│  utils               1         [View on GitHub →]       │
├─────────────────────────────────────────────────────────┤
│  Recent Issues:                                         │
│  • Bug: login fails on mobile (my-app) #123 - 2h ago   │
│  • Feature: add dark mode (backend) #456 - 1d ago      │
│  • Docs: update API reference (docs) #78 - 2d ago      │
└─────────────────────────────────────────────────────────┘
```

**CI Status Modal (special case)**

```
┌─────────────────────────────────────────────────────────┐
│  🔄 CI/CD Status                                   [X]  │
├─────────────────────────────────────────────────────────┤
│  ✅ Passing (15)                                        │
│  ─────────────────────────────────────────────────────  │
│  my-app, backend, docs, utils, api, web, mobile...     │
│                                                         │
│  ❌ Failing (2)                                         │
│  ─────────────────────────────────────────────────────  │
│  old-service    build failed       3h ago  [View →]    │
│  legacy-api     tests failed       1d ago  [View →]    │
│                                                         │
│  ⚪ No CI (6)                                           │
│  ─────────────────────────────────────────────────────  │
│  scripts, dotfiles, notes, experiments...              │
└─────────────────────────────────────────────────────────┘
```

**Pull Requests Modal**

```
┌─────────────────────────────────────────────────────────┐
│  🔀 Pull Requests                                  [X]  │
├─────────────────────────────────────────────────────────┤
│  📊 Summary                                             │
│  ─────────────────────────────────────────────────────  │
│  Open PRs: 8  |  Awaiting Your Review: 3  |  Your PRs: 2│
│                                                         │
│  👀 Awaiting Your Review                                │
│  ─────────────────────────────────────────────────────  │
│  • feat: add OAuth (backend) #45 - @john - 2h ago      │
│  • fix: memory leak (my-app) #23 - @jane - 1d ago      │
│  • docs: API guide (docs) #12 - @bob - 2d ago          │
│                                                         │
│  ✍️ Your Open PRs                                       │
│  ─────────────────────────────────────────────────────  │
│  • refactor: cleanup utils (utils) #67 - 3d ago        │
│  • feat: new dashboard (web) #89 - 1w ago              │
│                                                         │
│  📂 By Repository                                       │
│  ─────────────────────────────────────────────────────  │
│  backend: 3  |  my-app: 2  |  docs: 2  |  utils: 1     │
└─────────────────────────────────────────────────────────┘
```

### Interaction Behavior

| Action | Result |
|--------|--------|
| Click stat box | Opens modal with per-repo breakdown |
| Click repo name in modal | Opens GitHub repo in new tab |
| Click issue/PR in modal | Opens that issue/PR on GitHub |
| Click [X] or outside modal | Closes modal |
| Hover stat box | Shows cursor pointer, subtle highlight |

### Color Scheme
| Element | Color | Hex |
|---------|-------|-----|
| Stars | Gold/Yellow | `#f1c40f` |
| Forks | Blue | `#3498db` |
| Issues | Orange | `#e67e22` |
| PRs | Purple | `#9b59b6` |
| CI Pass | Green | `#004A28` |
| CI Fail | Red | `#74281E` |
| Commits | Teal | `#006179` |
| Watchers | Gray | `#607d8b` |

---

## Configuration Options

### Required
| Field | Type | Description |
|-------|------|-------------|
| Personal Access Token | Password/Secret | GitHub PAT for API access |

### Optional
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Display Name | Text | "GitHub Stats" | Widget header name |
| Refresh Interval | Select | 1 hour | How often to fetch data |
| Show Label | Checkbox | true | Show/hide widget header |
| Include Forks | Checkbox | false | Include forked repos in stats |
| Include Archived | Checkbox | false | Include archived repos |
| Repo Filter | Text | "" | Comma-separated repo names to include (empty = all) |
| Exclude Repos | Text | "" | Comma-separated repo names to exclude |
| Show Recent Activity | Checkbox | true | Show recent commits section |
| Show CI Status | Checkbox | true | Show CI/CD status section |

---

## API Endpoints Needed

### GitHub REST API v3
```
GET /user                           # Get authenticated user info
GET /user/repos                     # List user repositories
GET /repos/{owner}/{repo}           # Get repository details
GET /repos/{owner}/{repo}/commits   # Get recent commits
GET /repos/{owner}/{repo}/pulls     # Get pull requests
GET /repos/{owner}/{repo}/issues    # Get issues
GET /repos/{owner}/{repo}/actions/runs  # Get CI workflow runs
```

### GitHub GraphQL API v4 (Alternative - more efficient)
Single query can fetch most data in one request, reducing API calls.

```graphql
query {
  viewer {
    login
    avatarUrl
    repositories(first: 100, privacy: ALL, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        watchers { totalCount }
        issues(states: OPEN) { totalCount }
        pullRequests(states: OPEN) { totalCount }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 1) {
                nodes { committedDate message }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Backend Implementation

### New Route: `/api/github`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github/stats` | GET | Fetch all GitHub stats for widget |
| `/api/github/validate` | POST | Validate PAT token |

### Data Caching
- Cache API responses for 5 minutes on backend
- Reduces API calls if multiple widgets or page refreshes

### Error Handling
| Error | User Message |
|-------|--------------|
| 401 Unauthorized | "Invalid or expired token. Please update your GitHub PAT." |
| 403 Rate Limited | "GitHub API rate limit exceeded. Try again in X minutes." |
| Network Error | "Unable to reach GitHub. Check your connection." |

---

## Files to Create/Modify

### Backend
| Action | File |
|--------|------|
| Create | `/backend/src/routes/github.route.ts` |
| Modify | `/backend/src/routes/index.ts` |

### Frontend
| Action | File |
|--------|------|
| Modify | `/frontend/src/types/index.ts` |
| Modify | `/frontend/src/api/dash-api.ts` |
| Create | `/frontend/src/components/dashboard/base-items/widgets/GitHubWidget.tsx` |
| Create | `/frontend/src/components/dashboard/sortable-items/widgets/SortableGitHub.tsx` |
| Create | `/frontend/src/components/forms/configs/GitHubWidgetConfig.tsx` |
| Modify | `/frontend/src/components/forms/AddEditForm/constants.ts` |
| Modify | `/frontend/src/components/forms/AddEditForm/types.ts` |
| Modify | `/frontend/src/components/forms/AddEditForm/createWidgetConfig.ts` |
| Modify | `/frontend/src/components/forms/AddEditForm/AddEditForm.tsx` |
| Modify | `/frontend/src/components/forms/AddEditForm/useExistingItem.tsx` |
| Modify | `/frontend/src/components/forms/configs/WidgetConfig.tsx` |
| Modify | `/frontend/src/components/dashboard/DashboardGrid.tsx` |

---

## Security Considerations

1. **Token Storage**: PAT stored encrypted on backend (like other widgets)
2. **Token Scope**: Document minimum required scopes for users
3. **No Token Logging**: Never log tokens in backend
4. **Rate Limiting**: Implement backend rate limiting to prevent abuse

---

## Future Enhancements (v2+)

- [ ] Organization support (view org repos)
- [ ] Repository drill-down (click to see single repo details)
- [ ] Contribution graph (GitHub-style activity heatmap)
- [ ] Notification integration (unread notifications count)
- [ ] Multiple accounts support
- [ ] GitLab/Gitea support
- [ ] Webhook support for real-time updates

---

## Testing Checklist

- [ ] Widget appears in add widget menu
- [ ] Token validation works
- [ ] Public repos load without token
- [ ] Private repos load with valid token
- [ ] Invalid token shows appropriate error
- [ ] Rate limiting handled gracefully
- [ ] Stats calculate correctly across repos
- [ ] CI status displays correctly
- [ ] Recent activity shows correct data
- [ ] Refresh interval works as configured
- [ ] Configuration saves and loads properly
- [ ] Widget displays loading state
- [ ] Widget displays error state with retry
