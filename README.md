# Research Assistant

An AI-powered research assistant that helps users analyze academic papers and research documents through a multi-agent AI system.

## Features

- 📄 **PDF Document Processing**: Upload and process academic papers and research documents
- 🤖 **Multi-Agent AI System**: Specialized AI agents for different tasks
- 📝 **Smart Summarization**: Get concise summaries using the Summary Agent
- ❓ **Interactive Q&A**: Context-aware Q&A with dedicated QA Agent
- 📚 **Reference Extraction**: Automatic reference extraction via Reference Agent
- 📋 **Citation Generation**: Multiple citation styles handled by Citation Agent
- 🔄 **Real-time Updates**: WebSocket integration for live processing updates
- 🎯 **Confidence Scoring**: Each agent response includes confidence metrics

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
- OpenAI API Integration
- Agent-based Architecture
- PDF Processing
- Socket.io
- TypeScript

## AI Agents

The system uses a modular agent-based architecture:

### Summary Agent

- Generates concise document summaries
- Focuses on key findings and methodology
- Provides word count metrics

### QA Agent

- Handles natural language questions
- Context-aware responses
- Question type classification

### Reference Agent

- Extracts bibliography and citations
- Identifies academic references
- Maintains reference context

### Citation Agent

- Generates formatted citations
- Supports APA, MLA, Chicago styles
- Style-specific formatting

### Agent Orchestrator

- Coordinates between agents
- Confidence-based response selection
- Task routing and management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL
- OpenAI API Key

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

### Agent System Architecture

- **Task Recognition**: Agents automatically identify relevant tasks
- **Confidence Scoring**: Each agent provides confidence metrics
- **Metadata Generation**: Rich metadata for each response
- **Fallback Handling**: Graceful degradation when tasks are unclear

### Document Processing

- PDF file upload and text extraction
- Agent-based summarization and analysis
- Automatic reference and citation extraction

### Interactive Chat

- Context-aware question answering via QA Agent
- Real-time responses with confidence scores
- Multiple document context support

### Citation Management

- Citation Agent handles multiple styles
- Automatic metadata extraction
- Formatted citation generation with style detection

### Contributing

- Fork the repository
- Create your feature branch (git checkout -b feature/AmazingFeature)
- Commit your changes (git commit -m 'Add some AmazingFeature')
- Push to the branch (git push origin feature/AmazingFeature)
- Open a Pull Request
