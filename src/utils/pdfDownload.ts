const DEFAULT_PDF_ERROR = 'Failed to download PDF. Please try again.';

interface DownloadPdfFileOptions {
  url: string;
  filename: string;
  token?: string | null;
  languageCode?: string;
  systemKey?: string;
  accept?: string;
}

const getErrorMessageFromResponse = async (response: Response) => {
  let message = `Download failed (HTTP ${response.status})`;

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      message = errorData?.error?.message || errorData?.message || message;
    }
  } catch {
    // Keep the HTTP status message when the error response cannot be parsed.
  }

  if (message === 'Request not found!') {
    return 'Authentication error: the app configuration key was rejected by the server. Please contact support.';
  }

  return message;
};

const blobLooksLikePdf = async (blob: Blob) => {
  if (blob.type.includes('application/pdf')) {
    return true;
  }

  const signature = await blob.slice(0, 5).text();
  return signature === '%PDF-';
};

const tryReadJsonBlobMessage = async (blob: Blob) => {
  try {
    const data = JSON.parse(await blob.text());
    return data?.error?.message || data?.message;
  } catch {
    return undefined;
  }
};

export const downloadPdfFile = async ({
  url,
  filename,
  token,
  languageCode = 'ar',
  systemKey = import.meta.env.VITE_BACKEND_SYSTEM_KEY,
  accept = 'application/pdf, application/octet-stream, application/json',
}: DownloadPdfFileOptions) => {
  const headers = new Headers({
    Accept: accept,
    'App-Language': languageCode,
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (systemKey) {
    headers.set('System-Key', systemKey);
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    headers,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response));
  }

  const blob = await response.blob();
  const isPdf = await blobLooksLikePdf(blob);

  if (!isPdf) {
    const message = await tryReadJsonBlobMessage(blob);
    throw new Error(message || 'Server did not return a PDF. Please try again later.');
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

export const getPdfDownloadErrorMessage = (error: unknown, fallback = DEFAULT_PDF_ERROR) => (
  error instanceof Error ? error.message : fallback
);
