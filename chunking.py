from docling.chunking import HybridChunker
from langchain_docling import DoclingLoader

EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

def chunk_doc():
    doc=DoclingLoader("Karnatakas-New-Industrial-Policy-2025-30_compressed.pdf",chunker=HybridChunker(tokenizer=EMBED_MODEL_ID))
    docs=doc.load()
    return docs


def clean_metadata(doc):
    source = doc.metadata.get("source", "")
    
    # Extract all unique page numbers from the nested dl_meta
    page_numbers = set()
    dl_meta = doc.metadata.get("dl_meta", {})
    for item in dl_meta.get("doc_items", []):
        for prov in item.get("prov", []):
            page_numbers.add(prov.get("page_no"))
    
    # Replace metadata with clean, flat values
    doc.metadata = {
        "source": source,
        "pages": ", ".join(str(p) for p in sorted(page_numbers)),  # e.g. "1, 2"
        "page_start": min(page_numbers) if page_numbers else 0,
        "page_end": max(page_numbers) if page_numbers else 0,
    }
    docs = [clean_metadata(i) for i in doc]
    return docs