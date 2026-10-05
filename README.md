# MEMOu Deluxe — Terbuang Dalam Waktu

A responsive anniversary memory website template built with plain HTML, CSS, and JavaScript.

## Structure
- `index.html`
- `script.js`
- `style.css`
- `assets/images/cover.jpg`
- `assets/images/mem_1.jpg` … `mem_14.jpg`
- `assets/images/vintage-paper.png`
- `assets/audio/bgm.mp3` (optional; add an authorized audio file)

## Run locally
Use a local server so all assets load correctly:

```bash
python -m http.server 5500
```

Open `http://localhost:5500` from the template folder.

## Customization
Edit `DELUXE_CONFIG` at the top of `script.js` to change the names, anniversary date, letter, final message, and memory copy.


Responsive memory-card fix: memory cards are constrained to the viewport width, use minmax(0, 1fr), max-width, min-width: 0, and responsive image ratios so they do not force horizontal overflow or require browser zoom on phone/tablet/desktop.
