import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { toPng } from "html-to-image";
import { Download, Upload, XCircle, ArrowUp, ArrowDown } from "lucide-react";

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
  const cardRef = useRef(null);

  const CARD_WIDTH = 1280;
  const CARD_HEIGHT = 1600;

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      width: 600,
      height: 600,
      x: 340,
      y: 500,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const moveSelectionToBack = () => {
    if (!selectedId) return;
    const activeImage = images.find((img) => img.id === selectedId);
    const others = images.filter((img) => img.id !== selectedId);
    setImages([activeImage, ...others]);
  };

  const moveSelectionToFront = () => {
    if (!selectedId) return;
    const activeImage = images.find((img) => img.id === selectedId);
    const others = images.filter((img) => img.id !== selectedId);
    setImages([...others, activeImage]);
  };

  const removeImage = (id) => {
    setImages(images.filter((img) => img.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const saveImage = async () => {
    const originalSelection = selectedId;
    setSelectedId(null);
    if (cardRef.current) {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 1,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = "photocard.png";
      link.href = dataUrl;
      link.click();
    }
    setSelectedId(originalSelection);
  };

  return (
    <div style={styles.container}>
      {/* --- SIDEBAR --- */}
      <div style={styles.sidebar}>
        <h2 style={styles.heading}>Studio Editor</h2>

        <label style={styles.uploadBtn}>
          <Upload size={18} /> Add Photo
          <input type="file" multiple hidden onChange={handleUpload} />
        </label>

        <div style={styles.section}>
          <label style={styles.label}>Date</label>
          <input
            placeholder="Date"
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Title</label>
          <textarea
            placeholder="Type here... Use Enter for new lines"
            style={{ ...styles.input, height: "120px", resize: "vertical" }}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        {selectedId && (
          <div style={styles.section}>
            <label style={styles.label}>Layer Depth</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={moveSelectionToFront} style={styles.actionBtn}>
                <ArrowUp size={16} /> Front
              </button>
              <button onClick={moveSelectionToBack} style={styles.actionBtn}>
                <ArrowDown size={16} /> Back
              </button>
            </div>
          </div>
        )}

        <button onClick={saveImage} style={styles.saveBtn}>
          <Download size={18} /> Download PNG
        </button>
      </div>

      {/* --- WORKSPACE --- */}
      <div style={styles.workspace} onClick={() => setSelectedId(null)}>
        <div
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
          style={{ ...styles.card, width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          {/* IMAGE LAYERS */}
          {images.map((img, index) => (
            <Rnd
              key={img.id}
              default={{
                x: img.x,
                y: img.y,
                width: img.width,
                height: img.height,
              }}
              bounds="parent"
              onMouseDown={() => setSelectedId(img.id)}
              style={{
                zIndex: index + 1,
                border: selectedId === img.id ? "4px solid #3b82f6" : "none",
              }}
            >
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                {selectedId === img.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <XCircle size={32} fill="#ef4444" color="white" />
                  </button>
                )}
                <img
                  src={img.url}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </Rnd>
          ))}

          {/* FRAME LAYER */}
          <img src="./photocard.png" style={styles.frame} alt="Frame" />

          {/* TEXT OVERLAY */}
          <div style={styles.textOverlay}>
            <h1 className="custom-title" style={styles.titleText}>
              {title}
            </h1>
            <p className="custom-details" style={styles.subText}>
              {details}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#09090b",
    color: "white",
    fontFamily: "sans-serif",
  },
  sidebar: {
    width: "320px",
    padding: "30px",
    background: "#121214",
    borderRight: "1px solid #27272a",
    zIndex: 1000,
  },
  heading: { fontSize: "1.2rem", marginBottom: "30px" },
  section: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  input: {
    background: "#1c1c1f",
    border: "1px solid #3f3f46",
    padding: "12px",
    borderRadius: "6px",
    color: "white",
    fontSize: "14px",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
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
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  workspace: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    justifyContent: "center",
    padding: "80px",
    background: "#000",
  },
  card: {
    position: "relative",
    background: "#111",
    overflow: "hidden",
    flexShrink: 0,
  },
  deleteBtn: {
    position: "absolute",
    top: "-15px",
    right: "-15px",
    zIndex: 500,
    background: "none",
    border: "none",
    cursor: "pointer",
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
  titleText: { fontSize: "38px", margin: 0, color: "white", lineHeight: 1 },
  subText: {
    position: "absolute",
    bottom: "300px",
    left: "50%",
    transform: "translateX(-50%)", // The "magic" trick for perfect centering
    width: "80%", // Ensures multi-line text has room to wrap
    fontSize: "60px",
    color: "white",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    lineHeight: 1.2,
  },
};

export default App;
