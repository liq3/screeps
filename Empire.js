/* eslint no-console:off*/

REGEX_ROOM = /[WE](\d{1,2})[NS](\d{1,2})/g
REGEX_CREEP = /\[creep (.+)]/g

global.log = function(str) {
	if (typeof(str) !== 'string') {
		str = ''+str
	}
	str = str.replace(REGEX_ROOM, `<a href="#!/room/${Game.shard.name}/$&">$&</a>`)
	str = str.replace(REGEX_CREEP, (match, p1) => `<a href="#!/room/${Game.shard.name}/${Game.creeps[p1].room.name}">${p1}</a>`)
	console.log(str)
}

global.Empire = {}

Empire.MIN_STORAGE_ENERGY = 100000
Empire.getOwnedRooms = function() {
	let rooms = []
	for (let r in Game.rooms) {
		if (Game.rooms[r] && Game.rooms[r].controller && Game.rooms[r].controller
			&& ((Game.rooms[r].controller.reservation && Game.rooms[r].controller.reservation.username === Memory.username)
				|| Game.rooms[r].controller.my)) {
			rooms.push(Game.rooms[r])
		}
	}
	return rooms
}

Empire.getCostMatrixCallback = function(options) {
	return (roomName, costMatrix) => {return Empire.costMatrixCallback(roomName, costMatrix, options)};
}

Empire.costMatrixCallback = function(roomName, costMatrix, options) {
	if (Memory.rooms[roomName] && Memory.rooms[roomName].hostile) {
		return false;
	}

	let optionDefaults = {
		ignoreStructures:false,
		roadCost:1
	};

	if (!options) {
		options = optionDefaults
	}

	for (let option in optionDefaults) {
		if (options[option] === undefined) {
			options[option] = optionDefaults[option]
		}
	}

	if (!costMatrix) {
		costMatrix = new PathFinder.CostMatrix;
	}

	if (!options.ignoreStructures) {
		let structures = [];
		if (Game.rooms[roomName]) {
			structures = Game.rooms[roomName].find(FIND_STRUCTURES)
		}
		if (options.structures) {
			structures = structures.concat(options.structures.filter(s=>s.pos.roomName === roomName));
		}
		for (let structure of structures) {
			if (costMatrix.get(structure.pos.x, structure.pos.y))
			if (structure.structureType === STRUCTURE_ROAD) {
				if (costMatrix.get(structure.pos.x, structure.pos.y) === 0) {
					costMatrix.set(structure.pos.x, structure.pos.y, options.roadCost);
				}
			} else if (!(structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_CONTAINER)) {
				costMatrix.set(structure.pos.x, structure.pos.y, 255);
			}
		}
	}

	if (Game.rooms[roomName]) {
		let keepers = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS, {filter: {owner:'Source Keeper'}})
		for (let keeper of keepers) {
			for (let x = keeper.pos.x-3; x < keeper.pos.x+4; x++) {
				for (let y = keeper.pos.y-3; y < keeper.pos.y+4; y++) {
					costMatrix.set(x,y,255);
				}
			}
		}
	}
	return costMatrix;
}

Empire.getPathCost = function(a,b) {
	[a,b] = [a,b].sort()

	if (Memory.pathCosts[a] &&  Memory.pathCosts[a][b] && Memory.pathCosts[a][b].time > Game.time) {
		return Memory.pathCosts[a][b].cost;
	}

	[a,b] = [a,b].map(i=>Game.getObjectById(i))
	for (let v of [a,b]) {
		if (!v) {
			return;
		}
	}

	let path = PathFinder.search(a.pos, {pos:b.pos, range:1}, {roomCallback:Empire.costMatrixCallback, swampCost:2, plainsCost:2,maxOps:5000});
	if (!Memory.pathCosts[a.id]) {
		Memory.pathCosts[a.id] = {}
	}
	if (path.incomplete) {
		if (!Memory.pathCosts[a.id][b.id]) {
			Memory.pathCosts[a.id][b.id] = {cost:path.cost, time:Game.time + 100};
		} else {
			Memory.pathCosts[a.id][b.id] = Game.time + 100;
		}
		log(`Incomplete path: ${JSON.stringify(a.pos)} to ${JSON.stringify(b.pos)}`)
	} else {
		let pathTime = 50000;
		for (let pos of path.path) {
			let road = false
			let found = pos.lookFor(FIND_STRUCTURES)
			for (let i in found) {
				let s = found[i]
				if (s.structureType === STRUCTURE_ROAD) {
					road = true;
				}
			}
			if (!road) {
				pathTime = 1000;
				break;
			}
		}
		Memory.pathCosts[a.id][b.id] = {cost:path.cost, time:Game.time + pathTime}
	}
	return path.cost;
}

Empire.getRemoteRoadPlans = function(room) {
	let roads = []
	if (room.controller.my && Memory.rooms[room.name].remoteMining) {
		for (let remoteName of room.getRoomNames()) {
			if (Game.rooms[remoteName]) {
				for (let source of Game.rooms[remoteName].find(FIND_SOURCES)) {
					let path = PathFinder.search(room.find(FIND_MY_STRUCTURES, {filter: {structureType:STRUCTURE_SPAWN}})[0].pos,
						{pos:source.pos, range:1}, {
							roomCallback:Empire.getCostMatrixCallback({
								structures: roads.map(r=>{
									r = {pos:r};
									r.structureType = STRUCTURE_ROAD;
									return r;
								})
							}),
						 plainCost:2, swampCost:2})
					roads = roads.concat(path.path);
				}
			} else if (Memory.rooms[remoteName] && Memory.rooms[remoteName].sources) {
				for (let source of Memory.rooms[remoteName].sources) {
					let path = PathFinder.search(room.find(FIND_MY_STRUCTURES, {filter: {structureType:STRUCTURE_SPAWN}})[0].pos,
						{pos:new RoomPosition(...Object.values(source.pos)), range:1}, {roomCallback:Empire.costMatrixCallback, plainCost:2, swampCost:2})
					roads = roads.concat(path.path);
				}
			}
		}
	}
	return roads
}
