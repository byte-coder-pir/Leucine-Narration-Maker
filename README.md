# Leucine Narration Maker

A powerful web-based tool designed to convert Leucine workflow JSON files into structured CSV/XLSX spreadsheets. This tool extracts detailed information including stages, tasks, parameters, dependencies, validations, automations, and filtering logic, making it easier to analyze and document your workflows.

## Features

- **Multiple Format Support**: Upload single JSON files or ZIP archives containing multiple workflow JSONs.
- **Comprehensive Data Extraction**: Automatically extracts:
  - Stages and Tasks
  - Parameters and Instructions
  - Dependencies and prerequisites
  - Validations and Exception flows
  - Filters and Branching logic
  - Executor Locks
  - Automation triggers and actions
- **Multiple Export Formats**: Download your data as structured CSV or formatted XLSX files.
- **Dark Mode**: Built-in toggle between light and dark themes for comfortable viewing.
- **Privacy First**: All processing runs locally in your browser. No data is uploaded to any server.
- **Interactive Preview**: View and verify extracted data in a responsive table before exporting.

## Prerequisites

Before running this project, ensure you have the following installed:

1. **Node.js** (version 16 or higher)
   - [Download Node.js](https://nodejs.org/)
   - **Important**: During installation, ensure the **"Add to PATH"** option is checked.
2. **A modern web browser** (Chrome, Edge, Firefox, or Safari)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/byte-coder-pir/Leucine-Narration-Maker.git
cd Leucine-Narration-Maker
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including React, Vite, TailwindCSS, PapaParse, XLSX, and JSZip.

### 3. Start the Development Server

```bash
npm run dev
```

After running the command, open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173/`).

## How to Use

1. **Upload a File**:
   - Drag and drop a `.json` workflow file or a `.zip` archive containing multiple workflows into the upload area.
   - Alternatively, use the "Browse files" button.

2. **View the Data**:
   - The tool will instantly process the file and display extraction statistics (Total rows, Stages, Dependencies, etc.).
   - A preview table will appear showing the extracted data structure.

3. **Export**:
   - Click **Export CSV** to download a semicolon-delimited text file.
   - Click **Export XLSX** to download a formatted Excel spreadsheet.

## Data Extraction Details

The tool organizes extracted data into the following columns:

| Column | Description |
|--------|-------------|
| **Stage Name** | Name of the workflow stage |
| **Activity Name** | Name of the specific task |
| **Instruction Title** | Parameter or instruction label |
| **Options/Values** | Available choices, resource types, or default values |
| **Field Type** | Mandatory vs Optional |
| **Dependencies** | Task prerequisites and order |
| **Executor Lock** | Restrictions on who can execute the task |
| **Branching** | Conditional visibility logic (e.g., "Visible when X is Y") |
| **Filters** | Data filtering conditions |
| **Validations** | Input rules, error messages, and exception types |
| **Automation Details** | Triggers, actions, and mapping details |

## Building for Production

To create a production-ready build for deployment:

```bash
npm run build
```

The optimized files will be generated in the `dist` folder. You can test the production build locally using:

```bash
npm run preview
```

## Technologies Used

- **React 18**: UI Library
- **Vite**: Build Tool
- **TailwindCSS**: Styling
- **PapaParse**: CSV Generation
- **SheetJS (XLSX)**: Excel Export
- **JSZip**: Archive Processing

## Troubleshooting

### Common Issues

**PowerShell: "Script is not signed" or execution policy errors**
If you face issues running commands in Windows PowerShell, you may need to update your execution policy. Run the following command in PowerShell:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## License

This project is open-source and available under the [MIT License](LICENSE).