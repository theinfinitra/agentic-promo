/**
 * Extract HTML content from agent response text
 */
export const extractHtmlFromResponse = (responseText: string): string | null => {
  // Look for HTML content between ```html and ``` or just HTML tags
  
  // Method 1: Extract from markdown code blocks
  const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
  const htmlBlockMatch = responseText.match(htmlBlockRegex);
  
  if (htmlBlockMatch && htmlBlockMatch[1]) {
    return htmlBlockMatch[1].trim();
  }
  
  // Method 2: Extract HTML tags directly
  const htmlTagRegex = /<(form|div|table|section|article)[^>]*>[\s\S]*?<\/\1>/i;
  const htmlTagMatch = responseText.match(htmlTagRegex);
  
  if (htmlTagMatch && htmlTagMatch[0]) {
    return htmlTagMatch[0].trim();
  }
  
  // Method 3: Look for any HTML-like content
  if (responseText.includes('<') && responseText.includes('>')) {
    const startTag = responseText.indexOf('<');
    const endTag = responseText.lastIndexOf('>');
    
    if (startTag >= 0 && endTag > startTag) {
      return responseText.substring(startTag, endTag + 1).trim();
    }
  }
  
  return null;
};

/**
 * Clean extracted HTML for safe rendering
 */
export const cleanHtml = (html: string): string => {
  // Remove any script tags for security
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
