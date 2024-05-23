import backgroundImage from '../assets/img/brick_wall.jpg';

interface Vector {
    x: number;
    y: number;
}

class Ball {
    public position: Vector;
    public velocity: Vector;
    public radius: number;
    private mass: number;
    static gravity: number = 9.81 / 60; // More realistic gravity
    static damping: number = 0.98;
    static restitution: number = 0.9; // Slightly inelastic collisions
    public lightDirection: Vector;

    constructor(x: number, y: number, radius: number) {
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.radius = radius;
        this.mass = radius * radius * Math.PI; // Mass is proportional to area for uniform density

        // Initialize light direction randomly
        this.lightDirection = {
            x: Math.random() - 0.5,
            y: Math.random() - 0.5
        };
    }

    draw(ctx: CanvasRenderingContext2D): void {

        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

        // Create gradient for shine effect
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.1,
            this.position.x, this.position.y, this.radius
        );
        gradient.addColorStop(0, 'white'); // Center is brightest
        gradient.addColorStop(1, `hsl(${this.radius * 10}, 100%, 50%)`); // Color depends on size

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();

        // Reset shadows to avoid affecting other drawings
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }

    update(ctx: CanvasRenderingContext2D, balls: Ball[]): void {
        this.velocity.y += Ball.gravity; // Gravity applied each frame
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Boundary collision
        if (this.position.y + this.radius > ctx.canvas.height) {
            this.position.y = ctx.canvas.height - this.radius;
            // this.velocity.y *= -Ball.damping;
            this.velocity.y *= -(0.01+Ball.damping); // speed
        }

        // Prevent balls from escaping horizontally
        if (this.position.x + this.radius > ctx.canvas.width || this.position.x - this.radius < 0) {
            this.velocity.x *= -Ball.damping;
            this.position.x = Math.max(this.radius, Math.min(this.position.x, ctx.canvas.width - this.radius));
        }

        this.collideWithOthers(balls);
        this.draw(ctx);
    }

    collideWithOthers(balls: Ball[]): void {
        balls.forEach(ball => {
            if (ball !== this && this.collidesWith(ball)) {
                this.resolveCollision(ball);
            }
        });
    }

    collidesWith(other: Ball): boolean {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius + other.radius;
    }

    resolveCollision(other: Ball): void {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / distance;
        const ny = dy / distance;
        const dvx = this.velocity.x - other.velocity.x;
        const dvy = this.velocity.y - other.velocity.y;
        const vn = dvx * nx + dvy * ny;

        if (vn > 0) return;

        const i = (-(1 + Ball.restitution) * vn) / (1 / this.mass + 1 / other.mass);
        const impulseX = i * nx;
        const impulseY = i * ny;

        this.velocity.x += impulseX / this.mass;
        this.velocity.y += impulseY / this.mass;
        other.velocity.x -= impulseX / other.mass;
        other.velocity.y -= impulseY / other.mass;
    }
    
}

// define canvas

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const balls: Ball[] = [];

    canvas.addEventListener('click', event => {
        const radius = Math.random() * 20 + 10; // Random radius between 10 and 30
        balls.push(new Ball(event.clientX, event.clientY, radius));
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        balls.forEach(ball => {
            ball.update(ctx, balls);
            ball.draw(ctx);
        });
        requestAnimationFrame(animate);
    }

    animate(); // Start the animation loop
});

// play mute action

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('backgroundMusic') as HTMLAudioElement | null;
    const muteButton = document.getElementById('muteButton') as HTMLButtonElement | null;

    if (!audio || !muteButton) {
        console.error('Audio or Mute Button element not found!');
        return;
    }

    let hasPlayed = false;  // Flag to indicate if audio has been played

    muteButton.addEventListener('click', () => {
        if (!hasPlayed) {
            // First click: Attempt to play the audio
            audio.play().then(() => {
                console.log("Audio playback started successfully on first click.");
                hasPlayed = true;  // Set flag after successful playback
                muteButton.textContent = 'Mute';  // Assume audio is not muted after play starts
            }).catch(error => {
                console.error("Error occurred during audio playback:", error);
                // Inform the user if interaction was insufficient
                if (error.name === 'NotAllowedError') {
                    alert('Please click again to play the audio, or adjust your browser settings to allow autoplay.');
                }
            });
        } else {
            // Subsequent clicks: Toggle the mute state
            audio.muted = !audio.muted;
            muteButton.textContent = audio.muted ? 'Play' : 'Mute';
        }
    });
});

