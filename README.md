# Workflow JSON → CSV/XLSX Converter

A web-based tool for converting workflow JSON files into structured CSV/XLSX spreadsheets. This tool extracts and organizes workflow data including stages, tasks, parameters, dependencies, validations, automations, and more.

## Features

- **Multiple Format Support**: Upload single JSON files or ZIP archives containing multiple workflow JSONs
- **Comprehensive Data Extraction**: Extracts stages, tasks, parameters, dependencies, validations, filters, branching logic, executor locks, and automation details
- **Multiple Export Formats**: Download your data as CSV or XLSX files
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Privacy First**: All processing happens in your browser - no data is sent to any server
- **Interactive Preview**: View extracted data in a table before exporting

## Prerequisites

Before running this project, ensure you have the following installed:

### Required Software

1. **Node.js** (version 16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Includes npm (Node Package Manager)

2. **A modern web browser**
   - Chrome, Firefox, Safari, or Edge (latest version recommended)

### Checking if Node.js is Installed

Open your terminal/command prompt and run:

```bash
node --version
npm --version
```

If you see version numbers, you're good to go. If not, install Node.js from the link above.

## Installation & Setup

### Step 1: Download or Clone the Project

If you received this as a ZIP file, extract it to a folder on your computer.

If cloning from GitHub:

```bash
git clone <repository-url>
cd workflow-json-converter
```

### Step 2: Install Dependencies

Open your terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- React (UI framework)
- Vite (build tool)
- TailwindCSS (styling)
- PapaParse (CSV parsing)
- XLSX (Excel file handling)
- JSZip (ZIP file handling)
- FileSaver (file download utility)

### Step 3: Start the Development Server

Run the following command:

```bash
npm run dev
```

You should see output similar to:

```
  VITE v5.2.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Open in Browser

Open your web browser and navigate to:

```
http://localhost:5173/
```

The application should now be running!

## Platform-Specific Instructions

### Windows

1. **Install Node.js**:
   - Download the Windows installer from [nodejs.org](https://nodejs.org/)
   - Run the installer and follow the prompts
   - Restart your computer after installation

2. **Open Command Prompt or PowerShell**:
   - Press `Win + R`, type `cmd` or `powershell`, and press Enter
   - Navigate to the project folder:
     ```cmd
     cd C:\path\to\workflow-json-converter
     ```

3. **Run the commands**:
   ```cmd
   npm install
   npm run dev
   ```

### macOS

1. **Install Node.js**:
   - Download the macOS installer from [nodejs.org](https://nodejs.org/)
   - Or use Homebrew:
     ```bash
     brew install node
     ```

2. **Open Terminal**:
   - Press `Cmd + Space`, type "Terminal", and press Enter
   - Navigate to the project folder:
     ```bash
     cd /path/to/workflow-json-converter
     ```

3. **Run the commands**:
   ```bash
   npm install
   npm run dev
   ```

### Linux

1. **Install Node.js**:
   - Using apt (Ubuntu/Debian):
     ```bash
     sudo apt update
     sudo apt install nodejs npm
     ```
   - Or using the official repository:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```

2. **Run the commands**:
   ```bash
   npm install
   npm run dev
   ```

## How to Use

1. **Upload a File**:
   - Click "Browse files" or drag and drop a JSON or ZIP file into the upload area
   - Supported formats: `.json` (single workflow) or `.zip` (multiple workflows)

2. **View the Data**:
   - The tool will automatically process the file and display extracted data
   - View statistics at the top showing total rows, stages, dependencies, validations, etc.
   - Preview the data in the table below

3. **Export**:
   - Click "Export CSV" to download as a semicolon-delimited CSV file
   - Click "Export XLSX" to download as an Excel spreadsheet

4. **Dark Mode**:
   - Click the sun/moon icon in the top right to toggle between light and dark modes

## What Data Gets Extracted?

The converter extracts the following information from your workflow JSON:

- **Stage Name**: Workflow stage names
- **Activity Name**: Task names within each stage
- **Instruction Title**: Parameter labels/names
- **Options/Values**: Available choices or data types
- **Field Type**: Mandatory or optional fields
- **Activity/Parameter Type**: Type of input field
- **Dependencies**: Task prerequisites
- **Executor Lock**: Who can/cannot execute tasks
- **Branching**: Conditional visibility rules
- **Filters**: Data filtering conditions
- **Validations**: Input validation rules
- **Automation Details**: Automated actions and triggers

## Building for Production

To create a production-ready build:

```bash
npm run build
```

This creates an optimized build in the `dist` folder. You can then:

1. **Deploy to a web server**: Upload the contents of the `dist` folder to any static hosting service
2. **Run locally**: Use `npm run preview` to preview the production build

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check the terminal output for the actual URL.

### Installation Errors

If `npm install` fails:
- Delete the `node_modules` folder and `package-lock.json`
- Run `npm install` again
- Make sure you have a stable internet connection

### Module Not Found Errors

If you see "Cannot find module" errors:
- Make sure you ran `npm install` successfully
- Check that all dependencies are listed in [package.json](package.json)

### Browser Compatibility Issues

This tool requires a modern browser with ES6+ support. Update your browser to the latest version if you encounter issues.

## Project Structure

```
workflow-json-converter/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Project dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # TailwindCSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Technologies Used

- **React 18.3.1**: UI framework
- **Vite 5.2.0**: Fast build tool and dev server
- **TailwindCSS 3.4.0**: Utility-first CSS framework
- **PapaParse 5.4.1**: CSV parsing library
- **XLSX 0.18.5**: Excel file handling
- **JSZip 3.10.1**: ZIP file processing
- **FileSaver 2.0.5**: Client-side file downloads

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Contributing

Feel free to submit issues or pull requests to improve this tool.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on the GitHub repository
3. Make sure all prerequisites are installed correctly

---

**Note**: This tool processes all files locally in your browser. No data is uploaded to any server, ensuring your workflow information remains private and secure.
#   L e u c i n e - N a r r a t i o n - M a k e r  
 