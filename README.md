# NSIB Insurance System

A comprehensive insurance comparison tool for Group Medical and Motor Insurance.

## 🚀 Features

- **Group Medical Insurance**: Compare plans, calculate premiums, manage benefits
- **Motor Insurance**: Compare vehicle insurance quotes, analyze coverage
- **PDF Export**: Generate professional comparison reports
- **Local Storage**: Save and manage comparison history

## 📦 Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deploy to Netlify

### Method 1: Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

### Method 2: Netlify UI
1. Build the project: `npm run build`
2. Drag the `dist` folder to Netlify
3. Done!

### Method 3: GitHub Auto-Deploy
1. Push code to GitHub
2. Connect repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- Local Storage API

## 📝 License

© 2025 NSIB Insurance. All rights reserved.