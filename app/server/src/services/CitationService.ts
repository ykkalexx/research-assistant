interface CitationMetadata {
  authors: string[];
  title: string;
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  publisher?: string;
  url?: string;
}

export class CitationService {
  private extractMetadata(text: string): CitationMetadata {
    // basic metadata extraction using regex patterns
    const authors = this.extractAuthors(text);
    const title = this.extractTitle(text);
    const year = this.extractYear(text);
    const journal = this.extractJournal(text);
    const doi = this.extractDOI(text);

    return {
      authors,
      title,
      year,
      journal,
      doi,
    };
  }

  private extractAuthors(text: string): string[] {
    // looking for common author patterns at the start of the paper
    const authorPattern = /^([\w\s,.-]+(?:,|\sand\s|\s&\s|\set\sal\.)?)+/m;
    const match = text.match(authorPattern);
    if (!match) return [];

    // splitting and clean author names
    return match[0]
      .split(/,|\sand\s|\s&\s|\set\sal\./)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }

  private extractTitle(text: string): string {
    // looking for title patterns (usually after authors, in larger font, or before abstract)
    const titlePattern = /(?:title[:\s]+)(.*?)(?:\n|abstract)/i;
    const match = text.match(titlePattern);
    return match ? match[1].trim() : '';
  }

  private extractYear(text: string): number | undefined {
    // looking for year patterns (4 digits, typically in header or citations)
    const yearPattern = /\b(19|20)\d{2}\b/;
    const match = text.match(yearPattern);
    return match ? parseInt(match[0]) : undefined;
  }

  private extractJournal(text: string): string | undefined {
    // common journal citation patterns
    const journalPattern =
      /(?:published in|journal of|proceedings of)(.*?)(?:\.|,|\n)/i;
    const match = text.match(journalPattern);
    return match ? match[1].trim() : undefined;
  }

  private extractDOI(text: string): string | undefined {
    // doi pattern
    const doiPattern = /\b(10\.\d{4,}\/[-._;()\/:A-Z0-9]+)\b/i;
    const match = text.match(doiPattern);
    return match ? match[1] : undefined;
  }

  private formatAPA(metadata: CitationMetadata): string {
    const authors =
      metadata.authors.length > 0
        ? this.formatAPAAuthors(metadata.authors)
        : 'Unknown Author';

    const year = metadata.year ? `(${metadata.year})` : '(n.d.)';
    const title = metadata.title || 'Untitled';
    const journal = metadata.journal ? `. ${metadata.journal}` : '';
    const doi = metadata.doi ? `. https://doi.org/${metadata.doi}` : '';

    return `${authors} ${year}. ${title}${journal}${doi}`;
  }

  private formatMLA(metadata: CitationMetadata): string {
    const authors =
      metadata.authors.length > 0
        ? this.formatMLAAuthors(metadata.authors)
        : 'Unknown Author';

    const title = metadata.title ? `"${metadata.title}."` : '"Untitled."';
    const journal = metadata.journal ? ` ${metadata.journal}` : '';
    const year = metadata.year ? `, ${metadata.year}` : '';
    const doi = metadata.doi ? `. DOI: ${metadata.doi}` : '';

    return `${authors}. ${title}${journal}${year}${doi}`;
  }

  private formatChicago(metadata: CitationMetadata): string {
    const authors =
      metadata.authors.length > 0
        ? this.formatChicagoAuthors(metadata.authors)
        : 'Unknown Author';

    const title = metadata.title ? `"${metadata.title}."` : '"Untitled."';
    const journal = metadata.journal ? ` ${metadata.journal}` : '';
    const year = metadata.year ? ` (${metadata.year})` : '';
    const doi = metadata.doi ? `. DOI: ${metadata.doi}` : '';

    return `${authors}.${title}${journal}${year}${doi}.`;
  }

  private formatAPAAuthors(authors: string[]): string {
    if (authors.length === 0) return '';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    return `${authors[0]} et al.`;
  }

  private formatMLAAuthors(authors: string[]): string {
    if (authors.length === 0) return '';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    return `${authors[0]}, et al`;
  }

  private formatChicagoAuthors(authors: string[]): string {
    if (authors.length === 0) return '';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    if (authors.length === 3)
      return `${authors[0]}, ${authors[1]}, and ${authors[2]}`;
    return `${authors[0]} et al.`;
  }

  async generateCitation(
    context: string,
    style: 'APA' | 'MLA' | 'Chicago' = 'APA'
  ): Promise<string> {
    const metadata = this.extractMetadata(context);

    switch (style) {
      case 'APA':
        return this.formatAPA(metadata);
      case 'MLA':
        return this.formatMLA(metadata);
      case 'Chicago':
        return this.formatChicago(metadata);
      default:
        return this.formatAPA(metadata);
    }
  }
}
