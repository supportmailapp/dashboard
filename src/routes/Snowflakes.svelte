<script lang="ts">
  import { browser } from '$app/environment';
  import { getSnowflakes } from '$lib/stores/SnowflakeControls.svelte';
  import { Portal } from 'bits-ui';
  import { onDestroy, onMount } from 'svelte';

  const snowflakeCfg = getSnowflakes();
  let intensity = $derived(snowflakeCfg.intensity)

  let canvas = $state<HTMLCanvasElement>(undefined as unknown as HTMLCanvasElement);
  let ctx: CanvasRenderingContext2D;
  let snowflakes = $state<any[]>([]);
  let animationId: number;
  let snowflakeImage: HTMLImageElement[];

  // SVG snowflake designs
  const snowflakeSVGs = [
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm0 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm6 2l.75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12zm-12 0l.75 2.25L9 15l-2.25.75L6 18l-.75-2.25L3 15l2.25-.75L6 12z"/></svg>`,
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M12 1l.866 2.598L15 4.464l-2.134.866L12 8l-.866-2.598L9 4.536l2.134-.866L12 1zm0 8l.866 2.598L15 12.464l-2.134.866L12 16l-.866-2.598L9 12.536l2.134-.866L12 9zm0 8l.866 2.598L15 20.464l-2.134.866L12 24l-.866-2.598L9 20.536l2.134-.866L12 17zM4 5l.866 2.598L7 8.464 4.866 9.33 4 12l-.866-2.598L1 8.536l2.134-.866L4 5zm16 0l.866 2.598L23 8.464l-2.134.866L20 12l-.866-2.598L17 8.536l2.134-.866L20 5zm-8 7l.433 1.299L14 14.232l-1.567.433L12 16l-.433-1.299L10 14.268l1.567-.433L12 12z"/></svg>`,
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M12 2v20M2 12h20M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364M12 5l-1.5 4.5L6 12l4.5 1.5L12 18l1.5-4.5L18 12l-4.5-1.5L12 5z"/></svg>`,
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="white"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="6" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="8" cy="8" r="0.8"/><circle cx="16" cy="8" r="0.8"/><circle cx="8" cy="16" r="0.8"/><circle cx="16" cy="16" r="0.8"/><line x1="12" y1="2" x2="12" y2="22" stroke="white" stroke-width="0.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="white" stroke-width="0.5"/><line x1="4" y1="4" x2="20" y2="20" stroke="white" stroke-width="0.5"/><line x1="20" y1="4" x2="4" y2="20" stroke="white" stroke-width="0.5"/></g></svg>`
  ];
  
  $effect(() => {
    const count = Math.round((intensity / 10) * 200);
    updateSnowflakes(count);
  });
  
  function updateSnowflakes(count: number) {
    if (!canvas || !browser) return;
    
    if (count > snowflakes.length) {
      const toAdd = count - snowflakes.length;
      for (let i = 0; i < toAdd; i++) {
        snowflakes.push(createSnowflake());
      }
    } else if (count < snowflakes.length) {
      snowflakes = snowflakes.slice(0, count);
    }
  }
  
  function createSnowflake() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 15 + 8,
      speed: Math.random() * 1 + 0.5,
      wind: Math.random() * 0.5 - 0.25,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 2 - 1,
      svgIndex: Math.floor(Math.random() * snowflakeSVGs.length)
    };
  }
  
  /**
   * Converts an SVG string into an HTMLImageElement asynchronously.
   * 
   * @param svgString - The SVG markup as a string to be converted into an image
   * @param size - The width and height dimensions in pixels for the resulting image
   * @returns A Promise that resolves with the loaded HTMLImageElement
   * 
   * @description
   * This function is async because the Image element requires time to load the SVG data
   * from the object URL. The Promise wrapper ensures the caller waits until the `onload`
   * event fires before receiving the fully loaded image. Without the async/Promise pattern,
   * the image would be returned before it finished loading, making it unusable.
   */
  async function loadSVGAsImage(svgString: string, size: number): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image(size, size);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    });
  }

  const handleResize = () => {
    if (browser) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  
  onMount(async () => {
    if (!browser || !canvas) return;

    ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Preload all SVG images
    snowflakeImage = await Promise.all(
      snowflakeSVGs.map(svg => loadSVGAsImage(svg, 50))
    );
    
    const count = Math.round((intensity / 10) * 200);
    for (let i = 0; i < count; i++) {
      snowflakes.push(createSnowflake());
    }
    
    animate();
    
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    }
  });
  
  function animate() {
    if (!ctx || !canvas || !snowflakeImage) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    snowflakes.forEach(flake => {
      ctx.save();
      ctx.translate(flake.x, flake.y);
      ctx.rotate((flake.rotation * Math.PI) / 180);
      ctx.globalAlpha = 0.8;
      
      // Draw the SVG image
      const img = snowflakeImage[flake.svgIndex];
      ctx.drawImage(img, -flake.size / 2, -flake.size / 2, flake.size, flake.size);
      
      ctx.restore();
      
      flake.y += flake.speed;
      flake.x += flake.wind;
      flake.rotation += flake.rotationSpeed;
      
      if (flake.y > canvas.height) {
        flake.y = -flake.size;
        flake.x = Math.random() * canvas.width;
      }
    });
    
    animationId = requestAnimationFrame(animate);
  }
</script>

<Portal to="body" disabled>
  <canvas bind:this={canvas} class="snow-canvas"></canvas>
</Portal>

<style>
  .snow-canvas {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
</style>