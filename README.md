# OpenHands GitHub Dashboard

A modern, responsive dashboard that showcases contributions to the OpenHands repository and All-Hands-AI organization, with a special focus on highlighting external contributors.

## 🎯 Features

- **📊 Real-time GitHub Analytics**: Live data from OpenHands repository and All-Hands-AI organization
- **👥 External Contributor Focus**: Highlights community contributors outside the organization
- **📈 Interactive Visualizations**: Charts and graphs showing contribution patterns and activity
- **🌓 Dark/Light Mode**: Clean, modern interface with theme switching
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **⚡ Fast Performance**: Optimized with caching and efficient data loading

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone https://github.com/jamiechicago312/github-dashboard-OH.git
cd github-dashboard-OH
npm install
```

### 2. Configure GitHub Token

#### Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select these permissions:
   - ✅ `public_repo` (to read public repository data)
   - ✅ `read:org` (to read organization data)
   - ✅ `read:user` (to read user profiles)
4. Copy the generated token

#### Add Token to Environment

**For Local Development:**
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your token
GITHUB_TOKEN=your_github_token_here
NEXT_PUBLIC_APP_URL=http://localhost:12000
```

**⚠️ SECURITY NOTE**: Never commit your actual token to git. The `.env.local` file is already in `.gitignore`.

### 3. Test the Setup

```bash
# Start development server
npm run dev

# Test API connection (in another terminal)
curl http://localhost:12000/api/test
```

If successful, you should see repository data. If not, check your token configuration.

### 4. View the Dashboard

Open [http://localhost:12000](http://localhost:12000) in your browser.

## 🚀 Deployment to Vercel

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings (Vercel auto-detects Next.js)

### 2. Add Environment Variables

In Vercel project settings:

1. Go to **Settings → Environment Variables**
2. Add these variables:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your GitHub Personal Access Token
   - **Environment**: Production, Preview, Development

### 3. Deploy

Vercel will automatically deploy your application. Your dashboard will be available at:
`https://your-project-name.vercel.app`

## 📊 Dashboard Sections

### Overview Cards
- **Stars**: GitHub stars for OpenHands repository
- **Forks**: Repository forks count
- **Contributors**: Total number of contributors
- **External Contributors**: Community contributors (non-org members)

### External Contributors Spotlight
- Top external contributors by contribution count
- Contributor profiles with GitHub links
- Company and location information
- Contribution statistics

### Repository Metrics
- Open issues and recent activity
- Recent commits and pull requests
- Repository statistics and health metrics
- Language and size information

### Activity Charts
- Daily commit activity visualization
- Community impact percentage
- Recent activity trends
- External contribution analysis

## 🛠 Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Data Fetching**: SWR for caching and real-time updates
- **Charts**: Chart.js with React integration
- **Icons**: Lucide React
- **Deployment**: Vercel with edge functions

## 🔧 Development

### Project Structure

```
github-dashboard-OH/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utilities and API clients
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### API Endpoints

- `GET /api/github/dashboard` - Main dashboard data
- `GET /api/test` - Test GitHub API connection

## 🔒 Security & Rate Limits

### GitHub API Rate Limits
- **Authenticated**: 5,000 requests per hour
- **Unauthenticated**: 60 requests per hour

The dashboard implements:
- Automatic rate limit monitoring
- Request caching to minimize API calls
- Error handling for rate limit exceeded

### Token Security
- Tokens are stored as environment variables
- Never exposed to client-side code
- Used only in server-side API routes

## 🎨 Customization

### Themes
The dashboard supports light and dark themes. Users can toggle between themes using the button in the header.

### Styling
Built with Tailwind CSS. Customize colors and styling in:
- `tailwind.config.js` - Theme configuration
- `app/globals.css` - Global styles and CSS variables

### Data Refresh
- Dashboard data refreshes every 5 minutes automatically
- Manual refresh available through browser reload
- Real-time indicators show data freshness

## 🐛 Troubleshooting

### Common Issues

**Dashboard shows loading forever:**
- Check if GitHub token is properly configured
- Verify token has correct permissions
- Check browser console for API errors

**API rate limit exceeded:**
- Wait for rate limit to reset (shown in error message)
- Consider implementing longer caching intervals

**Deployment issues:**
- Ensure environment variables are set in Vercel
- Check build logs for errors
- Verify all dependencies are properly installed

### Debug Mode

Add `?debug=true` to the URL to see additional debugging information.

## 📈 Performance

The dashboard is optimized for performance:
- **Server-side rendering** for fast initial loads
- **Client-side caching** with SWR
- **Image optimization** with Next.js Image component
- **Code splitting** for smaller bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenHands Team** for the amazing project
- **All-Hands-AI Organization** for fostering open source collaboration
- **External Contributors** who make the project better every day

---

**Built with ❤️ for the OpenHands community**