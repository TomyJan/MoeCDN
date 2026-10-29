import { useEffect, useRef, useState } from 'react';
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

function PdfPage({
  document,
  number,
  failed,
}: {
  document: PDFDocumentProxy;
  number: number;
  failed: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(1 / Math.SQRT2);
  const [error, setError] = useState(false);
  useEffect(() => {
    const element = container.current!;
    const intersection = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: element.closest('.pdf-document'), rootMargin: '300px' },
    );
    intersection.observe(element);
    const resize = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    resize.observe(element);
    return () => {
      intersection.disconnect();
      resize.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!visible || !width) return;
    let cancelled = false;
    let task: RenderTask | undefined;
    const element = canvas.current!;
    setError(false);
    delete element.dataset.rendered;
    void document
      .getPage(number)
      .then(async (page) => {
        if (cancelled) return;
        const initial = page.getViewport({ scale: 1 });
        setRatio(initial.width / initial.height);
        const scale = width / initial.width;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * pixelRatio });
        element.width = Math.ceil(viewport.width);
        element.height = Math.ceil(viewport.height);
        task = page.render({ canvas: element, viewport });
        await task.promise;
        if (!cancelled) element.dataset.rendered = 'true';
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      task?.cancel();
      const release = () => {
        element.width = 0;
        element.height = 0;
        delete element.dataset.rendered;
      };
      // 等旧绘制结束再释放它自己的画布；新一轮渲染使用不同节点。
      if (task) void task.promise.then(release, release);
      else release();
    };
  }, [document, number, visible, width]);
  return (
    <div className="pdf-page" ref={container} style={{ aspectRatio: ratio }}>
      {error && <p role="alert">{failed}</p>}
      <canvas
        key={`${visible}-${width}`}
        ref={canvas}
        width={0}
        height={0}
        hidden={error}
        aria-label={`PDF · ${number}`}
      />
    </div>
  );
}

export default function PdfPreview({
  url,
  loading,
  failed,
}: {
  url: string;
  loading: string;
  failed: string;
}) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const task = getDocument({
      url,
      cMapUrl: '/_moecdn/pdf/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/_moecdn/pdf/standard_fonts/',
      wasmUrl: '/_moecdn/pdf/wasm/',
      iccUrl: '/_moecdn/pdf/iccs/',
    });
    void task.promise
      .then((value) => {
        if (!cancelled) setDocument(value);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [url]);
  if (error)
    return (
      <div className="preview-unavailable" role="alert">
        {failed}
      </div>
    );
  if (!document) return <div className="preview-loading">{loading}</div>;
  return (
    <div className="pdf-document">
      {Array.from({ length: document.numPages }, (_, index) => (
        <PdfPage
          key={index}
          document={document}
          number={index + 1}
          failed={failed}
        />
      ))}
    </div>
  );
}
