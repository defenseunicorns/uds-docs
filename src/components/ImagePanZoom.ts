function setupZoomAndPan() {
    console.log("Setting up zoom and pan");
    document.querySelectorAll('img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openZoom(img);
        });
    });
}

function openZoom(img: HTMLImageElement) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center;`;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `position: absolute; top: 20px; right: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer; background: white; border: none; border-radius: 5px;`;
    closeButton.addEventListener('click', () => overlay.remove());

    const clone = img.cloneNode(true) as HTMLImageElement;
    clone.style.position = 'absolute';
    clone.style.maxWidth = '90%';
    clone.style.maxHeight = '90%';
    clone.style.width = 'auto';
    clone.style.height = 'auto';
    clone.style.cursor = 'grab';
    clone.style.transition = 'none';

    overlay.appendChild(clone);
    overlay.appendChild(closeButton);
    document.body.appendChild(overlay);

    setupPan(clone, overlay);
}

function setupPan(img: HTMLImageElement, overlay: HTMLElement) {
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let posX = 0;
    let posY = 0;

    img.addEventListener('mousedown', (e) => {
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        posX = parseInt(img.style.left || '0', 10);  // Ensuring it defaults to 0 if undefined
        posY = parseInt(img.style.top || '0', 10);
        img.style.cursor = 'grabbing';
        e.preventDefault();  // This prevents default browser handling like image drag to drop/save
    });

    document.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const xDiff = e.clientX - startX;
        const yDiff = e.clientY - startY;
        img.style.left = `${posX + xDiff}px`;
        img.style.top = `${posY + yDiff}px`;
    });

    document.addEventListener('mouseup', (e) => {
        if (!isPanning) return;
        isPanning = false;
        img.style.cursor = 'grab';
        // Calculate final position on mouse up and update position variables
        posX += e.clientX - startX;
        posY += e.clientY - startY;
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}


export { setupZoomAndPan };
