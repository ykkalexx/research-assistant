# Research Assistant

An AI-powered research assistant that helps users analyze academic papers and research documents through natural language processing and machine learning.

## Features

- 📄 **PDF Document Processing**: Upload and process academic papers and research documents
- 📝 **Smart Summarization**: Get concise summaries of uploaded documents
- ❓ **Interactive Q&A**: Ask questions about the documents and get contextual answers
- 📚 **Reference Extraction**: Automatically extract and format citations and references
- 📋 **Multiple Citation Styles**: Generate citations in APA, MLA, and Chicago formats
- 🔄 **Real-time Updates**: WebSocket integration for live processing updates

## Tech Stack

### Frontend

- React + TypeScript
- Tailwind CSS
- Mantine UI Components
- Socket.io Client
- Axios

### Backend

- Node.js + Express
- MySQL Database
- OpenAI API
- HuggingFace Inference API
- PDF Processing
- Socket.io
- TypeScript

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL
- OpenAI API Key
- HuggingFace API Key

### Environment Setup

1. Create `.env` file in the server directory:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=research_assistant
OPENAI_API_KEY=your_openai_key
HUGGING_FACE_API_KEY=your_huggingface_key
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ykkalexx/research-assistant.git
cd research-assistant
```

2. Install Server Dependencies:

```bash
cd app/server
npm install
```

2. Install Client Dependencies:

```bash
cd app/client
npm install
```

4. Set up the database:

```bash
mysql -u root -p < app/server/src/migrations/001_migration.sql
```

## Features in Detail

### Document Processing

- PDF file upload and text extraction
- Automatic summarization using AI models
- Reference and citation extraction

### Interactive Chat

- Context-aware question answering
- Real-time responses using OpenAI
- Multiple document context support

### Citation Management

- Support for multiple citation styles (APA, MLA, Chicago)
- Automatic metadata extraction
- Formatted citation generation

### Contributing

- Fork the repository
- Create your feature branch (git checkout -b feature/AmazingFeature)
- Commit your changes (git commit -m 'Add some AmazingFeature')
- Push to the branch (git push origin feature/AmazingFeature)
- Open a Pull Request
