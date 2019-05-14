
//Variables
{
	//Canvas and context variables
	var canvas = document.getElementById("myCanvas");
	var overlay = document.getElementById("overlay");
	var wrapper = document.getElementById("wrapper");
	var ctx = canvas.getContext("2d");
	var defaultStrokeStyle = "black";
	
	//Game management variables
	var paused = false;
	var game = 0;
	var idealFR = 120;
	
	//Mouse/cursor variables
	var mouseX, mouseY = 0;
	var cursorWidth = 21;
	var cursorHeight = 21;
	
	//Missile base Variables
	var missileBases = [];
	var mBAmount = 3;
	var mBRadius = 20;
	var mBLineWidth = 2;
	var mBGunLength = 20;
	var missileAmount = 10;
	var activeMissileBase = 0;
	var mBEAngle = 0;
	var mBSAngle = Math.PI;
	var mBFillColor  = "#11B1AD";
	var mBActiveFillColor = "#FF0000"
	var mBOriginX = 0;
	var shortestDistToBase = 0;
	
	//Missile variables
	var missiles = [];
	var missileTrailColour = "#FF0000";
	var numOfMissiles = 0;
	var missileAngle = 0;
	var missileSpeed = 1.25;
	var missileDeadzone = 0.4;
	var dx = 0;
	var dy = 0;
	
	//Explosion variables
	var explosions = [];
	var explSpeed = 0.2;
	var explMinRadius = 0;
	var explMaxRadius = 40;
	var explFillColour = "#FFAA55";
	var explLineWidth = 1;
	var numOfExpl = 0;
	var timeToExpand = 0;
	var explDist = 0;
	var radiusDistPerTick = 0;
	
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
		this.isDestroyed = false;
		
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
		this.radius = {min: minRadius, max: maxRadius, curr: minRadius};
		this.speed = speed;
	}
}

//Game initialisation
{
	//Initialise arrays, draw first pass and set update loop going
	function init()
	{
		canvas.setAttribute("width", window.getComputedStyle(canvas).getPropertyValue("width"));
		canvas.setAttribute("height", window.getComputedStyle(canvas).getPropertyValue("height"));
		for(i = 0; i < mBAmount; i++)
		{			
			mBOriginX = ((i + 1) * (canvas.width / (mBAmount + 1)));
			missileBases.push( {structure: new MissileBase(mBOriginX, canvas.height, mBRadius, mBSAngle, mBEAngle, missileAmount)} );
		}
		
		draw();
		
		//Game refresh rate. Divisor defines ideal frame rate
		game = setInterval(GameUpdate, 1000 / idealFR);
	}

	//Alternative to using standard on-load
	function addLoadEvent(func) 
    {
		oldOnLoad = window.onload;
		if (typeof window.onload != 'function') 
        {
			window.onload = func;
		} else 
        {
		window.onload = function() 
        {
			if (oldonload) 
            {
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
		shortestDistToBase = canvas.width;
		activeMissileBase = null;
		
		//Get closest base that hasn't been destroyed and has ammo
		if(activeMissileBase == undefined)
		{
			for(i = 0; i < mBAmount; i++)
			{
				if( (Math.abs(mouseX - missileBases[i].structure.origin.x) < shortestDistToBase) && (!missileBases[i].structure.isDestroyed && missileBases[i].structure.missileAmount > 0))
				{
					shortestDistToBase = mouseX - missileBases[i].structure.origin.x;
					activeMissileBase = i;
				}
			}
		}
	}
	
	//Create a new missile using x and y params, check active missile base has ammo before firing
	function fireMissile(mouseX, mouseY)
	{
		if(activeMissileBase != null && missileBases[activeMissileBase].structure.missileAmount > 0)
		{
			missiles.push(new Missile(missileBases[activeMissileBase].structure.gunEndPoints.x, missileBases[activeMissileBase].structure.gunEndPoints.y, mouseX, mouseY));
			missileBases[activeMissileBase].structure.missileAmount--;
		}
		else if (activeMissileBase === null || missileBases[activeMissileBase].structure.missileAmount === 0) console.log("Out of missiles!");
	}
	
	//Calculate amount missile needs to move each tick
	function updateMissiles()
	{
		numOfMissiles = missiles.length;
		for(i = 0; i < numOfMissiles; i++)
		{
			if(missiles[i] != undefined && !missiles[i].isDead)
			{
				missileAngle = (Math.atan2( (missiles[i].dest.y - missiles[i].origin.y), missiles[i].dest.x - missiles[i].origin.x ));
				
				dx = (Math.cos(missileAngle) * missileSpeed);
				dy = (Math.sin(missileAngle) * missileSpeed);
				
				missiles[i].currPos.x += dx;
				missiles[i].currPos.y += dy;
				
				if( Math.abs(missiles[i].dest.x - missiles[i].currPos.x) < missileDeadzone || 
                   Math.abs(missiles[i].dest.y - missiles[i].currPos.y) < missileDeadzone)
				{
					missiles[i].isDead = true;
					
					createExplosion(missiles[i].currPos.x, missiles[i].currPos.y);
					
					dx = 0;
					dy = 0;
				}
			}
		}
		
		for(i = 0; i < numOfMissiles; i++)
		{
			if(missiles[i] != undefined && missiles[i].isDead)
			{
				missiles.splice(i, 1);
			}
		}
		
	}
	
	//Generate a new explosion and push it to explosion array. Indiscriminate of "owner" of explosions (player or comp).
	function createExplosion(explOriginX, explOriginY)
	{
		explosions.push(new Explosion(explOriginX, explOriginY, explMinRadius, explMaxRadius, explSpeed));
	}
	
	//Expand explosion radius according to the explosion speed
	function updateExplosions()
	{
		numOfExpl = explosions.length;
		for(i = 0; i < numOfExpl; i++)
		{
			if(explosions[i] != undefined)
			{
				explDist = explosions[i].radius.max - explosions[i].radius.min
				timeToExpand = explDist / explSpeed;
				radiusDistPerTick = explDist * (1 / timeToExpand);
				explosions[i].radius.curr += radiusDistPerTick;
			}
		}
		
		for(i = 0; i < numOfExpl; i++)
		{
			if(explosions[i] != undefined && explosions[i].radius.curr >= explosions[i].radius.max)
			{
				explosions.splice(i, 1);
			}
		}
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
	document.addEventListener("keyup", keyUpHandler);
	canvas.addEventListener("mousemove", mMoveHandler); 
	canvas.addEventListener("click", mClickHandler);
	
	//Keyboard handlers

	function keyUpHandler(e)
	{
		if(e.key == "Space" || e.keyCode == 32)
		{
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
		mouseY = e.clientY - wrapper.offsetTop;
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
		drawMissiles();
		drawExplosions();
	}
	
	//Draw missile base
	function drawBases()
	{
		//Iterate through each element of missileBases array, then access the properties of the value in each element i.e. the missile bases and draw them
		for(i = 0; i < mBAmount; i++)
		{
			ctx.strokeStyle = defaultStrokeStyle;
			ctx.beginPath();
			ctx.arc(missileBases[i].structure.origin.x, missileBases[i].structure.origin.y, missileBases[i].structure.radius, missileBases[i].structure.startPoint, missileBases[i].structure.endPoint);
			
			//Visual indicator for which base is active
			if(i === activeMissileBase && activeMissileBase != null) ctx.fillStyle = mBActiveFillColor;
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
		ctx.strokeStyle = defaultStrokeStyle;
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

	function drawMissiles()
	{
		for(i = 0; i < missiles.length; i++)
		{
			if(missiles.length <= 0) return;
			if (missiles[i] != undefined)
			{
				ctx.beginPath();
				ctx.moveTo(missiles[i].origin.x, missiles[i].origin.y);
				ctx.lineTo(missiles[i].currPos.x, missiles[i].currPos.y);
				ctx.strokeStyle = missileTrailColour;
				ctx.stroke();
				ctx.closePath();
			}
		}
	}
	
	function drawExplosions()
	{
        for(i = 0; i < explosions.length; i++)
		{
			if(explosions.length <= 0) return;
			if(explosions[i] != undefined)
			{
				ctx.strokeStyle = defaultStrokeStyle;
				ctx.beginPath();
				ctx.arc(explosions[i].origin.x, explosions[i].origin.y, explosions[i].radius.curr, 0, 2 * Math.PI);
				ctx.fillStyle = explFillColour;
				ctx.fill();
				ctx.lineWidth = explLineWidth;
				ctx.stroke();
				ctx.closePath();
			}
		}
	}
}
	
//Main update loops
{
	function update()
	{
		determineActiveMB();
		if(missiles.length > 0) updateMissiles();
		if(explosions.length > 0) updateExplosions();
	}
	
	//Main game loop
	function GameUpdate()
	{
		if(!paused){
			update();
			draw();
		}
	}
}
