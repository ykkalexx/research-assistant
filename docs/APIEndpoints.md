# API Documentation

## Endpoints

### Document Management

#### Upload Document

`POST /api/upload`

- Accepts PDF files
- Returns document ID and initial processing status

#### Get Document

`GET /api/documents`

- Returns list of uploaded documents
- Includes metadata and processing status

### Document Analysis

#### Get Summary

`POST /api/summary`

`````json
{
  "id": "document_id"
}

`POST /api/question`

```json
{
"documentId": "document_id",
"question": "your question"
}

`POST /api/citation`

````json
{
  "id": "document_id",
  "style": "APA|MLA|Chicago"
}
```


`````
