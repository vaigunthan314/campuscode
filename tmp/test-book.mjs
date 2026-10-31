import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-swiftshader']
});

const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Check if intro screen is showing
try {
  const skipButton = page.locator('button').filter({ hasText: 'SKIP INTRO' });
  const skipCount = await skipButton.count();
  console.log('Has SKIP INTRO button:', skipCount > 0);
  
  if (skipCount > 0) {
    console.log('Skipping intro...');
    await skipButton.click();
    await page.waitForTimeout(1000);
  }
} catch (e) {
  console.log('No intro button found');
}

// Instead of scrollIntoView, use window.scrollTo to scroll the page
await page.evaluate(() => {
  const el = document.querySelector('#howitworks');
  if (el) {
    const rect = el.getBoundingClientRect();
    // Scroll to position the section so it starts at 50px from top
    const targetY = rect.top + window.scrollY - 50;
    window.scrollTo({ top: targetY, behavior: 'auto' });
  }
});

// Log the section rect and scroll position
const sectionInfo = await page.evaluate(() => {
  const el = document.getElementById('howitworks');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    rectTop: rect.top,
    rectBottom: rect.bottom,
    scrollY: window.scrollY,
    sectionTopAbsolute: rect.top + window.scrollY
  };
});
console.log('Section position:', JSON.stringify(sectionInfo, null, 2));

// Wait for animation to settle
await page.waitForTimeout(2000);

// Log the scroll position
const scrollInfo = await page.evaluate(() => {
  return {
    scrollY: window.scrollY,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight
  };
});
console.log('Scroll position:', JSON.stringify(scrollInfo, null, 2));
await page.waitForTimeout(3000);

// Check page content
const contentInfo = await page.evaluate(() => {
  const howSection = document.getElementById('howitworks');
  if (!howSection) return { error: 'Section not found' };
  
  // Get the section's bounding rect
  const rect = howSection.getBoundingClientRect();
  
  // Get the canvas and its container
  const canvas = howSection.querySelector('canvas');
  const canvasContainer = canvas?.parentElement;
  
  // Get the canvas dimensions and position
  const canvasRect = canvas?.getBoundingClientRect() || { width: 0, height: 0 };
  
  return {
    sectionExists: true,
    sectionHeight: howSection.offsetHeight,
    hasCanvas: !!canvas,
    canvasWidth: canvasRect.width,
    canvasHeight: canvasRect.height,
    canvasContainerWidth: canvasContainer?.offsetWidth,
    canvasContainerHeight: canvasContainer?.offsetHeight,
    position: rect,
    hasThreeJS: typeof THREE !== 'undefined',
    first100Chars: howSection.innerHTML.substring(0, 100)
  };
});
console.log('How section info:', JSON.stringify(contentInfo, null, 2));

// Check all properties of the stage in more detail
const stageProps = await page.evaluate(() => {
  const stage = window.__ccStage;
  if (!stage) return { error: 'No stage' };
  
  // Get all properties
  const props = {};
  for (const key in stage) {
    if (typeof stage[key] !== 'function') {
      const val = stage[key];
      props[key] = {
        type: typeof val,
        isNull: val === null,
        isUndefined: val === undefined,
        isArray: Array.isArray(val),
        isObject: typeof val === 'object' && val !== null,
        value: val === null ? 'null' : val === undefined ? 'undefined' : 
               Array.isArray(val) ? `array[${val.length}]` :
               typeof val === 'object' ? val.constructor?.name || 'object' :
               String(val).substring(0, 100)
      };
    }
  }
  
  return props;
});
console.log('Stage props:', JSON.stringify(stageProps, null, 2));

// Check the host element
const hostInfo = await page.evaluate(() => {
  const stage = window.__ccStage;
  if (!stage?.host) return { error: 'No host' };
  
  const host = stage.host;
  const rect = host.getBoundingClientRect();
  const style = window.getComputedStyle(host);
  
  return {
    tagName: host.tagName,
    className: host.className,
    id: host.id,
    rect,
    style: {
      width: style.width,
      height: style.height,
      position: style.position,
      top: style.top,
      left: style.left,
      transform: style.transform,
      opacity: style.opacity,
      visibility: style.visibility,
      display: style.display,
      zIndex: style.zIndex,
      background: style.background,
      backgroundImage: style.backgroundImage,
      overflow: style.overflow
    },
    children: Array.from(host.children).map(c => ({
      tagName: c.tagName,
      className: c.className,
      id: c.id,
      style: {
        position: window.getComputedStyle(c).position,
        top: window.getComputedStyle(c).top,
        left: window.getComputedStyle(c).left,
        width: window.getComputedStyle(c).width,
        height: window.getComputedStyle(c).height,
        opacity: window.getComputedStyle(c).opacity,
        visibility: window.getComputedStyle(c).visibility
      }
    }))
  };
});
console.log('Host info:', JSON.stringify(hostInfo, null, 2));

// Check if textures have images loaded
const textureImages = await page.evaluate(() => {
  const stage = window.__ccStage;
  const texImages = {};
  
  for (const key in stage) {
    if (key.toLowerCase().endsWith('tex') || key.toLowerCase().endsWith('texture')) {
      const tex = stage[key];
      if (tex?.image) {
        texImages[key] = {
          image: {
            width: tex.image.width,
            height: tex.image.height,
            src: tex.image.src,
            complete: tex.image.complete,
            naturalWidth: tex.image.naturalWidth,
            naturalHeight: tex.image.naturalHeight
          },
          needsUpdate: tex.needsUpdate,
          isCanvas: !!tex.image?.getContext
        };
      }
    }
  }
  
  return texImages;
});
console.log('Texture images:', JSON.stringify(textureImages, null, 2));

// Let's check all properties of the stage in detail
const allStageProps = await page.evaluate(() => {
  const stage = window.__ccStage;
  const props = {};
  
  for (const key in stage) {
    const val = stage[key];
    if (typeof val !== 'function') {
      props[key] = {
        type: typeof val,
        isNull: val === null,
        isArray: Array.isArray(val),
        isObject: typeof val === 'object' && val !== null,
        constructor: val?.constructor?.name,
        valuePreview: val === null ? 'null' : 
                      val === undefined ? 'undefined' :
                      Array.isArray(val) ? `[${val.length} items]` :
                      typeof val === 'object' ? val.constructor?.name || 'object' :
                      String(val).substring(0, 200)
      };
    }
  }
  
  return props;
});
console.log('All stage props:', JSON.stringify(allStageProps, null, 2));

// Now let's check the lighting setup
const lightingInfo = await page.evaluate(() => {
  const stage = window.__ccStage;
  const lights = [];
  
  stage.scene.traverse((obj) => {
    if (obj.isLight) {
      lights.push({
        type: obj.type,
        name: obj.name,
        position: obj.position.toArray().map(n => n.toFixed(2)),
        intensity: obj.intensity,
        color: obj.color?.getHexString(),
        distance: obj.distance,
        angle: obj.angle,
        penumbra: obj.penumbra,
        decay: obj.decay,
        visible: obj.visible
      });
    }
  });
  
  return lights;
});
console.log('Lighting info:', JSON.stringify(lightingInfo, null, 2));

// Check if there's a render loop running
const renderLoopInfo = await page.evaluate(() => {
  const stage = window.__ccStage;
  
  // Check if animate function exists
  const hasAnimate = typeof stage.animate === 'function';
  
  // Check if RAF is being used
  const rafActive = window.__ccRafActive !== undefined ? window.__ccRafActive : 'unknown';
  
  return { hasAnimate, rafActive };
});
console.log('Render loop info:', JSON.stringify(renderLoopInfo, null, 2));

// Force a render and check if anything appears
console.log('Forcing a render...');
await page.evaluate(() => {
  const stage = window.__ccStage;
  if (stage?.renderer && stage?.scene && stage?.camera) {
    stage.renderer.render(stage.scene, stage.camera);
    console.log('Render called');
  }
});
await page.waitForTimeout(500);

// Take a screenshot after forcing render
await page.screenshot({ path: 'tmp/book-after-force-render.png' });
console.log('Screenshot after force render saved');

// Check if there are any errors in the console
const consoleLogs = await page.evaluate(() => {
  return {
    hasConsole: typeof console !== 'undefined',
    hasWebGL: !!document.createElement('canvas').getContext('webgl2'),
    webglErrorMessage: ''
  };
});
console.log('Console info:', JSON.stringify(consoleLogs, null, 2));

// Now let's check the lighting in more detail
const detailedLighting = await page.evaluate(() => {
  const stage = window.__ccStage;
  const lights = [];
  
  stage.scene.traverse((obj) => {
    if (obj.isLight) {
      lights.push({
        type: obj.type,
        name: obj.name,
        position: obj.position.toArray().map(n => n.toFixed(2)),
        intensity: obj.intensity,
        color: obj.color?.getHexString(),
        distance: obj.distance,
        angle: obj.angle,
        penumbra: obj.penumbra,
        decay: obj.decay,
        visible: obj.visible
      });
    }
  });
  
  return lights;
});
console.log('Detailed lighting:', JSON.stringify(detailedLighting, null, 2));

// Now let's check for console errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});

// Navigate to the page again to capture console errors
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

console.log('Console errors:', errors.length > 0 ? errors : 'none');

// Scroll to the howitworks section
await page.evaluate(() => {
  const el = document.querySelector('#howitworks');
  if (el) {
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.scrollY - 50;
    window.scrollTo({ top: targetY, behavior: 'auto' });
  }
});
await page.waitForTimeout(4000);

// Check if the book canvas has any content
const canvasCheck = await page.evaluate(() => {
  const canvases = document.querySelectorAll('canvas');
  const results = [];
  
  canvases.forEach((canvas, i) => {
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Check if it's a WebGL canvas
    const webglCtx = canvas.getContext('webgl2');
    
    results.push({
      index: i,
      className: canvas.className,
      rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
      has2dContext: !!ctx,
      hasWebGLContext: !!webglCtx,
      isVisible: canvas.offsetParent !== null,
      style: {
        opacity: window.getComputedStyle(canvas).opacity,
        visibility: window.getComputedStyle(canvas).visibility,
        display: window.getComputedStyle(canvas).display
      }
    });
  });
  
  return results;
});
console.log('Canvas check:', JSON.stringify(canvasCheck, null, 2));

// Check the stage in detail
const stageCheck = await page.evaluate(() => {
  const stage = window.__ccStage;
  if (!stage) return { error: 'No stage' };
  
  return {
    hasStage: true,
    hostExists: !!stage.host,
    rendererExists: !!stage.renderer,
    sceneExists: !!stage.scene,
    cameraExists: !!stage.camera,
    rootExists: !!stage.root,
    hostRect: stage.host?.getBoundingClientRect(),
    hostStyle: {
      position: window.getComputedStyle(stage.host).position,
      top: window.getComputedStyle(stage.host).top,
      left: window.getComputedStyle(stage.host).left,
      width: window.getComputedStyle(stage.host).width,
      height: window.getComputedStyle(stage.host).height,
      opacity: window.getComputedStyle(stage.host).opacity,
      visibility: window.getComputedStyle(stage.host).visibility,
      display: window.getComputedStyle(stage.host).display
    },
    canvasCount: document.querySelectorAll('canvas').length
  };
});
console.log('Stage check:', JSON.stringify(stageCheck, null, 2));

// Check if the host is actually in the DOM
const hostInDom = await page.evaluate(() => {
  const stage = window.__ccStage;
  if (!stage?.host) return { inDom: false };
  
  const host = stage.host;
  let parent = host.parentElement;
  const path = [];
  while (parent) {
    path.push(parent.className);
    parent = parent.parentElement;
  }
  
  return {
    inDom: host.parentElement !== null,
    parentPath: path,
    hostOffsetParent: host.offsetParent ? host.offsetParent.className : 'null',
    hostOffsetTop: host.offsetTop,
    hostOffsetLeft: host.offsetLeft,
    hostClientTop: host.clientTop,
    hostClientLeft: host.clientLeft
  };
});
console.log('Host in DOM:', JSON.stringify(hostInDom, null, 2));

// Take screenshot before closing
await page.screenshot({ path: 'tmp/book-full.png' });
console.log('Full page screenshot saved to tmp/book-full.png');

await browser.close();


// Take screenshot
await page.screenshot({ path: 'tmp/book-full.png' });
console.log('Full page screenshot saved to tmp/book-full.png');

await browser.close();


// Check if stage exists
const stage = await page.evaluate(() => window.__ccStage);
console.log('Stage exists:', !!stage);

if (stage) {
  // Check book materials
  const bookInfo = await page.evaluate(() => {
    const s = window.__ccStage;
    return {
      coverOpacity: s.coverDetailMaterial?.opacity,
      coverVisible: s.coverDetailMaterial?.visible,
      rootPosition: s.root?.position?.toArray()?.map(n => n.toFixed(3)),
      rootRotation: {
        x: s.root?.rotation?.x?.toFixed(3),
        y: s.root?.rotation?.y?.toFixed(3),
        z: s.root?.rotation?.z?.toFixed(3)
      }
    };
  });
  console.log('Book state:', JSON.stringify(bookInfo, null, 2));
}

// Take screenshot
await page.screenshot({ path: 'tmp/book-full.png' });
console.log('Full page screenshot saved to tmp/book-full.png');

// Also take a screenshot of just the book canvas (centered crop)
await page.screenshot({ path: 'tmp/book-canvas-crop.png' });
console.log('Book canvas crop saved to tmp/book-canvas-crop.png');

await browser.close();
