export default function Bubbles(ctx) {
    const canvas = ctx.canvas
    this.bubblesArray = [];
    console.log(canvas.width, canvas.height)

    

    this.init = function() {
        for (let i = 0; i < 5; i++) {
            this.bubblesArray.push(new Bubble(ctx));
        }
    }

    this.animate = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.bubblesArray.forEach(bubble => {
            bubble.update();
            bubble.draw();
        });
        if (this.bubblesArray.length < 5) {
            this.bubblesArray.push(new Bubble(ctx));
        }
    }

    this.getDistance = function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    canvas.addEventListener('click', (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        this.bubblesArray = this.bubblesArray.filter(bubble => {
            const distance = getDistance(mouseX, mouseY, bubble.x, bubble.y);
            return distance > bubble.radius;
        });
    });
    this.getBubblesArray = function() {
    console.log(canvas.width, canvas.height)

        return this.bubblesArray
    }
    this.setBubblesArray = function(arry) {
        this.bubblesArray = arry
    }
    

   
}

class Bubble {
    constructor(ctx) {
        this.canvas = ctx.canvas
        this.ctx = ctx
        this.x = Math.random() * this.canvas.width;
        this.y = 0 - Math.random() * this.canvas.height;
        this.radius = Math.random() * 20 + 50;
        this.speed = Math.random() * 30 + 1;
        this.angle = Math.random() * 2 * Math.PI;
        this.opacity = Math.random() * 0.5 + 0.5;
    }
    update() {
        this.y += this.speed;
        if (this.y > this.canvas.height - this.radius) {
            this.y = 0 + this.radius;
            this.x = Math.random() * this.canvas.width;
            this.speed = Math.random() * 30 + 1;
        }
    }
    draw() {
        this.ctx.fillStyle = `rgba(173, 216, 230, ${this.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
}