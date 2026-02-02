import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { toPng } from "html-to-image";
import { Download, Upload, XCircle, Menu, X } from "lucide-react";

const App = () => {
  const getBengaliDate = () => {
    return new Intl.DateTimeFormat("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  };

  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState(getBengaliDate());
  const [details, setDetails] = useState("এখানে লিখুন");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const cardRef = useRef(null);
  const workspaceRef = useRef(null);

  const CARD_WIDTH = 1280;
  const CARD_HEIGHT = 1600;

  // Responsive Scaling Logic
  useEffect(() => {
    const updateScale = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (workspaceRef.current) {
        const hPadding = mobile ? 40 : 100;
        const vPadding = mobile ? 160 : 100;
        const availW = workspaceRef.current.offsetWidth - hPadding;
        const availH = workspaceRef.current.offsetHeight - vPadding;
        const newScale = Math.min(availW / CARD_WIDTH, availH / CARD_HEIGHT, 1);
        setScale(newScale);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      width: 600,
      height: 600,
      // Initial Position: Center of the Card
      x: (CARD_WIDTH - 600) / 2,
      y: (CARD_HEIGHT - 600) / 2.5,
      zoom: 1,
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (isMobile) setSidebarOpen(false);
  };

  const moveSelectionToBack = () => {
    if (!selectedId) return;
    const index = images.findIndex((img) => img.id === selectedId);
    const newImages = [...images];
    const [movedItem] = newImages.splice(index, 1);
    newImages.unshift(movedItem);
    setImages(newImages);
  };

  const moveSelectionToFront = () => {
    if (!selectedId) return;
    const index = images.findIndex((img) => img.id === selectedId);
    const newImages = [...images];
    const [movedItem] = newImages.splice(index, 1);
    newImages.push(movedItem);
    setImages(newImages);
  };

  const saveImage = async () => {
    const originalSelection = selectedId;
    setSelectedId(null);

    // Wait for border removal
    await new Promise((r) => setTimeout(r, 80));

    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // 📱 Mobile-safe: open real image tab
        window.open(url, "_blank");
      } else {
        // 💻 Desktop download
        const link = document.createElement("a");
        link.href = url;
        link.download = `photocard-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Image export failed. Try again.");
    }

    setSelectedId(originalSelection);
  };

  return (
    <div style={styles.container}>
      {/* MOBILE HEADER */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#3b82f6" }}>
            Studio Editor
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.menuBtn}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      <div style={styles.mainLayout}>
        {/* SIDEBAR */}
        <aside
          style={{
            ...styles.sidebar,
            transform:
              sidebarOpen || !isMobile ? "translateX(0)" : "translateX(-100%)",
            position: isMobile ? "fixed" : "relative",
          }}
        >
          <div style={styles.sidebarScrollArea}>
            <h2 style={styles.sidebarHeading}>Editor Tools</h2>

            <label style={styles.uploadBtn}>
              <Upload size={18} /> Add Photo
              <input type="file" multiple hidden onChange={handleUpload} />
            </label>

            <div style={styles.section}>
              <label style={styles.label}>Date (Title Font)</label>
              <input
                style={{ ...styles.input, fontFamily: "TitleFont" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Details (Body Font)</label>
              <textarea
                style={{
                  ...styles.input,
                  height: "100px",
                  resize: "none",
                  fontFamily: "BodyFont",
                }}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div style={styles.section}>
              <button onClick={saveImage} style={styles.saveBtn}>
                <Download size={18} /> Download PNG
              </button>
            </div>

            {selectedId && (
              <div style={styles.section}>
                <label style={styles.label}>Layer Order</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={moveSelectionToFront}
                    style={styles.actionBtn}
                  >
                    Bring Front
                  </button>
                  <button
                    onClick={moveSelectionToBack}
                    style={styles.actionBtn}
                  >
                    Send Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STICKY SIDEBAR FOOTER */}
          <div style={styles.sidebarFooter}></div>
        </aside>

        {/* WORKSPACE */}
        <main
          ref={workspaceRef}
          style={styles.workspace}
          onClick={() => setSelectedId(null)}
        >
          <div
            style={{
              width: CARD_WIDTH * scale,
              height: CARD_HEIGHT * scale,
              position: "relative",
            }}
          >
            <div
              ref={cardRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                ...styles.card,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              {/* Image Layers */}
              {images.map((img, index) => (
                <Rnd
                  key={img.id}
                  size={{ width: img.width, height: img.height }}
                  scale={scale}
                  enableResizing={!isMobile}
                  position={{ x: img.x, y: img.y }}
                  onDragStop={(e, d) => {
                    setImages(
                      images.map((i) =>
                        i.id === img.id ? { ...i, x: d.x, y: d.y } : i
                      )
                    );
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setImages(
                      images.map((i) =>
                        i.id === img.id
                          ? {
                              ...i,
                              width: parseInt(ref.style.width),
                              height: parseInt(ref.style.height),
                              ...position,
                            }
                          : i
                      )
                    );
                  }}
                  bounds="parent"
                  onMouseDown={() => setSelectedId(img.id)}
                  style={{
                    zIndex: index + 1,
                    border:
                      selectedId === img.id ? "5px solid #3b82f6" : "none",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {selectedId === img.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages(images.filter((i) => i.id !== img.id));
                          setSelectedId(null);
                        }}
                        style={styles.deleteBtn}
                      >
                        <XCircle size={36} fill="#ef4444" color="white" />
                      </button>
                    )}
                    <img
                      src={img.url}
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `scale(${img.zoom})`,
                        touchAction: "none", // 🔑 allows pinch zoom
                      }}
                      onWheel={(e) => {
                        if (!isMobile) {
                          e.preventDefault();
                          const delta = e.deltaY < 0 ? 0.05 : -0.05;
                          setImages(
                            images.map((i) =>
                              i.id === img.id
                                ? { ...i, zoom: Math.max(0.3, i.zoom + delta) }
                                : i
                            )
                          );
                        }
                      }}
                      onTouchMove={(e) => {
                        if (e.touches.length === 2) {
                          const dist = Math.hypot(
                            e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY
                          );

                          if (!img._lastDist) img._lastDist = dist;

                          const delta = (dist - img._lastDist) / 200;
                          img._lastDist = dist;

                          setImages(
                            images.map((i) =>
                              i.id === img.id
                                ? { ...i, zoom: Math.max(0.3, i.zoom + delta) }
                                : i
                            )
                          );
                        }
                      }}
                    />
                  </div>
                </Rnd>
              ))}

              {/* Static Frame (Z-index high) */}
              <img src="./photocard.png" style={styles.frame} alt="Frame" />

              {/* Text Overlay (Z-index highest) */}
              <div style={styles.textOverlay}>
                <h1
                  className="custom-title"
                  style={{ ...styles.titleText, fontFamily: "TitleFont" }}
                >
                  {title}
                </h1>
                <p
                  className="custom-details"
                  style={{ ...styles.subText, fontFamily: "BodyFont" }}
                >
                  {details}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    background: "#09090b",
    color: "white",
    overflow: "hidden",
  },
  mainLayout: {
    display: "flex",
    flex: 1,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  mobileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: "64px",
    background: "#1a1a1e",
    borderBottom: "1px solid #27272a",
    zIndex: 4000,
  },
  menuBtn: {
    background: "#27272a",
    border: "none",
    color: "white",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebar: {
    width: "320px",
    height: "100%",
    background: "#121214",
    borderRight: "1px solid #27272a",
    zIndex: 3000,
    transition: "transform 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },
  sidebarScrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sidebarFooter: {
    padding: "20px 24px",
    borderTop: "1px solid #27272a",
    background: "#121214",
  },
  sidebarHeading: {
    fontSize: "1.2rem",
    margin: "0 0 10px 0",
    color: "#3b82f6",
  },
  section: { display: "flex", flexDirection: "column", gap: "8px" },
  label: {
    fontSize: "11px",
    color: "#71717a",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  input: {
    background: "#1c1c1f",
    border: "1px solid #3f3f46",
    padding: "12px",
    borderRadius: "6px",
    color: "white",
    outline: "none",
  },
  uploadBtn: {
    background: "#2563eb",
    padding: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "bold",
  },
  actionBtn: {
    flex: 1,
    background: "#27272a",
    border: "1px solid #3f3f46",
    color: "white",
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  saveBtn: {
    width: "100%",
    background: "#10b981",
    border: "none",
    color: "white",
    padding: "16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  workspace: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#000",
    padding: "20px",
    overflow: "hidden",
  },
  card: {
    position: "relative",
    background: "#111",
    overflow: "hidden",
    boxShadow: "0 0 50px rgba(0,0,0,0.8)",
  },
  frame: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 200,
    pointerEvents: "none",
  },
  textOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 300,
    padding: "95px 120px 120px 90px",
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  deleteBtn: {
    position: "absolute",
    top: "-18px",
    right: "-18px",
    zIndex: 500,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  titleText: { fontSize: "38px", margin: 0, color: "white", lineHeight: 1 },
  subText: {
    position: "absolute",
    bottom: "280px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "85%",
    fontSize: "62px",
    color: "white",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    lineHeight: 1.1,
  },
};

export default App;
