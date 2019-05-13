
//Variables
{
	//Canvas and context variables
	var canvas = document.getElementById("myCanvas");
	var overlay = document.getElementById("overlay");
	var wrapper = document.getElementById("wrapper");
	var ctx = canvas.getContext("2d");
	
	//Game management variables
	var paused = false;
	var spacePressed = false;
	var game = 0;
	var idealFR = 120;
	
	//Mouse/cursor variables
	var mouseX, mouseY = 0;
	var cursorWidth = 21;
	var cursorHeight = 21;
	
	//Missile base Variables
	var missileBases = [];
	var mBAmount = 3;
	var mBAmountOdd = false;
	var mBRadius = 20;
	var mBLineWidth = 2;
	var mBGunLength = 20;
	var missileAmount = 10;
	var activeMissileBase = 0;
	var mBEAngle = 0;
	var mBSAngle = Math.PI;
	var missilesLeft = missileAmount;
	var mBFillColor  = "#11B1AD";
	var mBActiveFillColor = "#FF0000"
	var mBOriginX = 0;
	
	//Missile variables
	var missiles = [];
	var missileSpeed = 1;
	
	//MissileBaseGuns
	var gunAngle = 0;
	var gunStartPoints = [];
	var gunEndPoints = [];
	
	//Loop variables
	var i = 0;
	
	//Colour value conversion
	var hex = 0;
	
	//Window on-load variable
	var oldOnLoad = {};
}

//Classes
{
	function MissileBase(originX, originY, radius, startPoint, endPoint, missileAmount)
	{
		this.origin = {x: originX, y: originY};
		this.gunStartPoints = {x: 0, y: 0};
		this.gunEndPoints = {x: 0, y: 0};
		this.radius = radius;
		
		//Start and end point define where arc drawing begins and ends, clockwise
		this.startPoint = startPoint;
		this.endPoint = endPoint;
		
		this.missileAmount = missileAmount;
	}
	
	function Missile(originX, originY, destX, destY)
	{
		this.origin = {x: originX, y: originY};
		this.currPos = {x: this.origin.x, y: this.origin.y};
		this.dest = {x: destX, y: destY};
		this.speed = missileSpeed;
		this.isDead = false;
		this.canExplode = true;
	}
	
	function Explosion(originX, originY, minRadius, maxRadius, speed)
	{
		this.origin = {x: originX, y: originY};
		this.radius = {min: minRadius, max: maxRadius};
		this.speed = speed;
	}
}

//Game initialisation
{
	//Initialise arrays, draw first pass and set update loop going
	function init()
	{
		
		for(i = 0; i < mBAmount; i++)
		{			
			mBOriginX = ((i + 1) * (canvas.width / (mBAmount + 1)));
			missileBases.push( {structure: new MissileBase(mBOriginX, canvas.height, mBRadius, mBSAngle, mBEAngle, missileAmount)} );
		}
		
		draw();
		
		//Game refresh rate. Divisor defines ideal frame rate
		game = setInterval(update, 1000 / idealFR);
	}

	//Alternative to using standard onload
	function addLoadEvent(func) {
		oldOnLoad = window.onload;
		if (typeof window.onload != 'function') {
			window.onload = func;
		} else {
		window.onload = function() {
			if (oldonload) {
				oldonload();
			}
		func();
		}
	  }
	}

	//Initial call
	addLoadEvent(init);
}

//Utilities
{
	//Conversion of RGB values to hex codes (from stack overflow)
	{
		function componentToHex(c) 
		{
			hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		}

		function rgbToHex(r, g, b) 
		{
			return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
		}
	}
	
	//Clears game refresh interval and resets on pause toggle
	function pauseGame()
	{
		if(!paused){
			game = clearInterval(update);
			paused = true;
			document.getElementById("overlay").style.display = "block";
		}
		else if (paused)
		{
			game = setInterval(update, 1000/120);
			paused = false;
			document.getElementById("overlay").style.display = "none";
		}
	}
	
	//Determines active missile base via the mouseX position
	function determineActiveMB()
	{
		for(i = 0; i < mBAmount; i++)
		{
			if((mouseX > (canvas.width/mBAmount) * i) && (mouseX < (canvas.width/mBAmount) * (i + 1)))
			{
				return activeMissileBase = i;
			}
		}
	}
	
	function fireMissile(mouseX, mouseY)
	{
		console.log("MouseX: " + mouseX + " MouseY: " + mouseY);
		
		if(missileBases[activeMissileBase].structure.missileAmount > 0)
		{
			missiles.push(new Missile(missileBases[activeMissileBase].structure.gunEndPoints.x, missileBases[activeMissileBase].structure.gunEndPoints.y, mouseX, mouseY));
			missileBases[activeMissileBase].structure.missileAmount--;
		}
		else if (missileBases[activeMissileBase].structure.missileAmount === 0) console.log("Out of missiles!");
		
		console.log(missiles);
	}
	
	//Calculates the angle of the base guns based on the difference between the gun origin and the mouse cursor then uses this angle
	//to generate start and endpoints for a drawn line of length equal some arbitrary value.
	//atan2 is used as it returns an angle relative to the whole circle, while atan only uses the two rightmost quadrants of a circle
	function calcGunStartEndPts(index)
	{
		gunAngle = (Math.atan2( (mouseY - (missileBases[index].structure.origin.y - mBRadius)), (mouseX - missileBases[index].structure.origin.x) ));
		
		missileBases[index].structure.gunStartPoints.x = missileBases[index].structure.origin.x,
		missileBases[index].structure.gunStartPoints.y = missileBases[index].structure.origin.y - mBRadius;
		
		missileBases[index].structure.gunEndPoints.x = missileBases[index].structure.gunStartPoints.x + (mBGunLength * Math.cos(gunAngle)),
		missileBases[index].structure.gunEndPoints.y =  missileBases[index].structure.gunStartPoints.y + (mBGunLength * Math.sin(gunAngle));
	}
}

//Event handlers
{
	document.addEventListener("keydown", keyDownHandler);
	document.addEventListener("keypress", keyPressHandler);
	document.addEventListener("keyup", keyUpHandler);
	document.addEventListener("mousemove", mMoveHandler);
	document.addEventListener("click", mClickHandler);
	
	//Keyboard handlers
	function keyDownHandler(e)
	{
		if(e.key == "Space character" || e.keyCode == 32)
		{
			spacePressed = true;
		}
	}
	
	function keyPressHandler(e)
	{
	}

	function keyUpHandler(e)
	{
		if(e.key == "Space" || e.keyCode == 32)
		{
			spacePressed = false;
			pauseGame();
		}
	}

	//Mouse handlers
	function mClickHandler(e)
	{
		fireMissile(mouseX, mouseY);
	}
	
	function mMoveHandler(e)
	{
		mouseX = e.clientX - wrapper.offsetLeft;
		mouseY = e.clientY;
	}
}

//Draw Calls
{
	//Clear canvas and call all draw functions
	function draw()
	{
		//Clear canvas and re-call draw functions
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawBases();
		drawCursor();
	}
	
	//Draw missile base
	function drawBases()
	{
		//Iterate through each element of missileBases array, then access the properties of the value in each element i.e. the missile bases and draw them
		for(i = 0; i < mBAmount; i++)
		{
			ctx.beginPath();
			ctx.arc(missileBases[i].structure.origin.x, missileBases[i].structure.origin.y, missileBases[i].structure.radius, missileBases[i].structure.startPoint, missileBases[i].structure.endPoint);
			
			//Visual indicator for which base is active
			if(i === activeMissileBase) ctx.fillStyle = mBActiveFillColor;
			else ctx.fillStyle = mBFillColor;
			
			ctx.fill();
			ctx.lineWidth = mBLineWidth;
			ctx.stroke();
			ctx.closePath();
			
			calcGunStartEndPts(i);
			
			//Draw gun using calculated end points
			ctx.beginPath();
			ctx.moveTo(missileBases[i].structure.gunStartPoints.x, missileBases[i].structure.gunStartPoints.y);
			ctx.lineTo(missileBases[i].structure.gunEndPoints.x, missileBases[i].structure.gunEndPoints.y);
			ctx.stroke();
			ctx.closePath();
		}
	}
	
	//Draws square around cursor point plus dot in the middle for clarity
	function drawCursor()
	{
		//Draw outer square
		ctx.beginPath();
		ctx.rect(mouseX - (cursorWidth / 2), mouseY - canvas.offsetTop - (cursorHeight / 2), cursorWidth, cursorHeight);
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.closePath();
		
		//Draw inner dot
		ctx.beginPath();
		ctx.rect(mouseX, mouseY - canvas.offsetTop, 1, 1);
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.closePath();
	}
}
	
//Update loops
{
	function inputUpdate()
	{
		determineActiveMB();
	}
	
	//Main game loop
	function update()
	{
		if(!paused){
			inputUpdate();
			draw();
		}
	}
}
