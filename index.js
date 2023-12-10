$(document).ready(function(){
const scoreElement = $('#scoreElement');
const canvas = $('#myCanvas')[0];
const context = canvas.getContext('2d');
const scale = 0.3;

class Player{
    constructor(){
        this.velocity = {
            x:0,
            y:0
        };

        this.position = {
            x:200,
            y:200
        };

        this.image = new Image();
        this.image.src = './img/ship.png';

        this.width = 100*scale;
        this.height = 100*scale;

        this.life = 3;
        this.active = true;

        // Ensure the image is loaded before drawing
        this.image.onload = () => {
            this.width = 100*scale;
            this.height = 100*scale;
            this.position = {
                x:canvas.width/2 - this.width/2,
                y:canvas.height - this.height - 20
            };
            this.draw();
        };
    }

    draw(){
        context.drawImage(this.image,this.position.x,this.position.y,this.width,this.height);
    }

    updateMovement(){
        this.draw();
        this.position.x += this.velocity.x
    }
}

class Projectile{
    constructor({position,velocity}){
        this.position = position;
        this.velocity = velocity;
        this.radius = 4
    }

    draw() {
        context.beginPath();
        context.arc(this.position.x, this.position.y,this.radius,0,Math.PI*2);
        context.fillStyle = 'red'
        context.fill();
        context.closePath;
    }

    updateMovement(){
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

    }
}

class InvaderProjectile{
    constructor({position,velocity}){
        this.position = position;
        this.velocity = velocity;

        this.width = 3;
        this.height = 10;

    }

    draw() {
        context.fillStyle = 'white';
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    
    updateMovement(){
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

    }
}

class Explosion{
    constructor({position,velocity,radius,color,fades}){
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.fades = fades
    }

    draw() {
        context.save();// save the context before draw the explosion happen
        context.globalAlpha = this.opacity; //set the transparency
        context.beginPath();
        context.arc(this.position.x, this.position.y,this.radius,0,Math.PI*2);
        context.fillStyle = this.color
        context.fill();
        context.closePath;
        context.restore(); // restore the previous context
    }

    updateMovement(){
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.fades){
            this.opacity -= 0.01;
        }
    }
}

class Invader{
    constructor({position}){

        this.velocity = {
            x:0,
            y:0
        };

        this.position = {
            x:position.x,
            y:position.y
        }
        this.image = new Image();
        this.image.src = './img/invader.png';

        // make sure image onload then draw
        this.image.onload = () => {
            
            this.width = 100*scale;
            this.height = 100*scale;
            this.draw();
        };
    }

    draw(){
        context.drawImage(this.image,this.position.x,this.position.y,this.width,this.height);
    }

    updateMovement({velocity}){
        this.draw();
        this.position.x += velocity.x;
        this.position.y += velocity.y  
    }

    shoot(invaderProjectiles){
        invaderProjectiles.push(new InvaderProjectile({
        position:{
            x: this.position.x + this.width/2,
            y: this.position.y + this.height
            },
        velocity:{
            x:0,
            y:2
        }}))
    }
}

class Grid {
    constructor(){
        this.position={
            x:0,
            y:0
        }

        //normal speed
        this.velocity={
            x:1.5,
            y:0
        }
        
        this.invaders = []
        
        const columns = 8
        const rows = 5

        this.width = columns*40

        // push invaders into grid
        for (let y = 0; y < rows; y++)
        {
            for(let x = 0; x <columns; x++){
                this.invaders.push(new Invader({position:{
                    x: x * 40,
                    y: y * 40
                }}))
            }
        }
    }
    updateMovement(){
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // if grid move out of right edge or grid move out of left edge then change direction
        this.velocity.y = 0;
        if (this.position.x + this.width >= canvas.width || this.position.x <= 0){
            this.velocity.x = -this.velocity.x
            this.velocity.y = 30;
        }
    }
}

const projectiles = [];
const player = new Player();
const grids = [new Grid()];
const invaderProjectiles = [];
const explosions = [];
let lastShotTime = 0; // prepare shooting time
const shotInterval = 2000; // invader sends a projectile every 2s 
let score = 0;
let playerLifeDecreased = false;
const lifeElement = $('#lifeElement'); // select player.life

const keys = {
    ArrowRight:{
        pressed: false
    },
    ArrowLeft:{
        pressed: false
    }
}

// reuse explosion as stars
for(let i = 0; i<=60; i++)
{
    explosions.push(new Explosion({
        position:{
        x:Math.random()* canvas.width,
        y:Math.random()* canvas.height
        },
        velocity:{
            x: 0,
            y: 0.4
        },
        radius:Math.random() * 3,
        color:'white'
    }))
}

// for create the explosion animate
function createExplosion({object,color,fades}){
    for(let i = 0; i<=15 ; i++)
    {
        explosions.push(new Explosion({
            position:{
            x:object.position.x + object.width/2,
            y:object.position.y + object.height /2 
            },
            velocity:{
                x: (Math.random()-0.5)*3,
                y: (Math.random()-0.5)*3
            },
            radius:Math.random() * 6,
            color:color,
            fades:fades
        }))
    }
}

function animate(){
    // to store the history score to local browser and display on the screen when game end
    // Check if historyScore exists in localStorage
    let historyScore = JSON.parse(localStorage.getItem('historyScore')) || [];

    // finish the game and return if the player life is equal to 0
    if (player.active === false) {

        historyScore.push(score);

        // local storage need to save string value
        localStorage.setItem('historyScore', JSON.stringify(historyScore));

        // from localStorage get the array
        const storedHistoryScore = JSON.parse(localStorage.getItem('historyScore')) || [];
        //decreasing display
        storedHistoryScore.sort((a, b) => b - a);
        context.font = '40px Arial';
        context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2 - 20);

        //Math.min get the 2 numbers minimum one, and for each display
        for (let i = 0; i < Math.min(5, storedHistoryScore.length); i++) {
            context.fillText(`${i + 1}: ${storedHistoryScore[i]}`, canvas.width / 2 - 100, canvas.height / 2 + 20 + i * 40);
        }
        // end of the game
        return;
    }
    // refresh frame
    requestAnimationFrame(animate); 
    context.fillStyle = 'black';
    context.fillRect(0,0,canvas.width,canvas.height);
    player.updateMovement(); 

    //for each projectile are shoot by ship, do splice and garbage collection
    projectiles.forEach((projectile,index) =>{
        if(projectile.position.y <= 0){
            setTimeout(()=>{
                projectiles.splice(index,1)
            },0)
        }else{
            projectile.updateMovement();
        }
    })

    explosions.forEach((explosion,index) => {
        if(explosion.position.y + explosion.radius >= canvas.height)
        {
            explosion.position.x = Math.random() * canvas.width;
            explosion.position.y = -explosion.radius;
        }
        if(explosion.opacity <= 0){
            setTimeout(()=>{
                explosions.splice(index,1);
            },0)
        }else{
            explosion.updateMovement()
        }
    })

    grids.forEach(grid => {
        grid.updateMovement();
        // invaders shoot projectiles
        const currentTime = Date.now();
        if (currentTime - lastShotTime >= shotInterval && grid.invaders.length > 0) {
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles);
            lastShotTime = currentTime;
        }

        invaderProjectiles.forEach((invaderProjectile,index) => {
            invaderProjectile.updateMovement();

            // garbage collection
            if(invaderProjectile.position.y > canvas.height){
                setTimeout(()=>{
                    invaderProjectiles.splice(index,1);
                },0)
            }else{
                invaderProjectile.updateMovement();
            }

            // invader projectile hits player, collision detection
            if( invaderProjectile.position.y + invaderProjectile.height >= player.position.y &&
                invaderProjectile.position.x + invaderProjectile.width >= player.position.x &&
                invaderProjectile.position.x <= player.position.x + player.width){

                setTimeout(()=>{
                    invaderProjectiles.splice(index,1);
                },0)   

                createExplosion({
                    object: player,
                    color: 'red',
                    fades:true
                })

                player.life -= 1;
                lifeElement.text(player.life);
                console.log(player.life);

                if(player.life === 0)
                {
                    setTimeout(()=>{
                        player.active = false;
                    },1000);
                    
                }
            }

        })

        grid.invaders.forEach((invader,i) =>{
            
            invader.updateMovement({velocity: grid.velocity});

            if(invader.position.y + invader.height >= player.position.y + player.height && playerLifeDecreased ===false){
                player.life -= 1;
                createExplosion({
                    object: player,
                    color: 'red',
                    fades:true
                })
                playerLifeDecreased = true; //life decreased 

                setTimeout(()=>{
                    // Remove the entire grid
                    grids.splice(grids[0], 1);

                    grids.push(new Grid()); // Create a new grid
                },3000);

                if(player.life === 0)
                {
                    setTimeout(()=>{
                        player.active = false;
                    },1000);
                    
                }
            }else if (invader.position.y + invader.height < player.position.y + player.height) {
                // reset flag，use to detect collision next time
                lifeDecreased = false;
            }


            projectiles.forEach((projectile,j) => {
                // collision detect, projectile hits the invader
                if( projectile.position.x - projectile.radius <= invader.position.x + invader.width &&
                    projectile.position.x + projectile.radius >= invader.position.x &&
                    projectile.position.y - projectile.radius <= invader.position.y + invader.height &&
                    projectile.position.y + projectile.radius >= invader.position.y)
                    {
                        // create 10 explosion 

                        setTimeout(()=>{ 
                            // make sure the invader and projectile are to be found
                            const invaderFound = grid.invaders.find(
                                (invader2) => invader2 === invader
                            )
                            const projectileFound = projectiles.find(
                                (projectile2) => projectile2 === projectile
                            )
                            
                            // remove the invader and projectile
                            if(invaderFound && projectileFound){

                                score += 10;
                                scoreElement.text(score);
                                // create explosion
                                createExplosion({
                                    object:invader,
                                    color:'lightblue',
                                    fades:true
                                });
                                grid.invaders.splice(i,1);
                                projectiles.splice(j,1);
                                if (grid.invaders.length === 0) {
                                    // If all invaders are defeated, create a new grid with new invaders
                                    grids.length = 0; // Clear existing grids
                                    grids.push(new Grid()); // Create a new grid
                                }
                                
                            }
                            
                        },0)
                    }
            })
        })
    })

    if(keys.ArrowLeft.pressed && player.position.x >0){
        player.velocity.x = -5;
    }else if(keys.ArrowRight.pressed && player.position.x + player.width < canvas.width){
        player.velocity.x = +5;
    }else{
        player.velocity.x = 0;
    }

}
$(document).ready(animate());

$(document).on('keydown', function(event) { 
    var key = event.key;

    switch(key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            break;
        case ' ':
            if (projectiles.length === 0) {
                projectiles.push(
                    new Projectile({
                        position: {
                            x: player.position.x + player.width / 2,
                            y: player.position.y
                        },
                        velocity: {
                            x: 0,
                            y: -7 // change projectile speed
                        }
                    })
                );
            }
            break;
    }
});

$(document).on('keyup', function(event) {
    var key = event.key;

    switch(key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
        case ' ':
            break;
    }
});

});