module.exports = {

	run: function (creep) {
		if (creep.memory.job == 'attack') {
			this.jobAttack(creep);
		} else if (creep.memory.job == 'guard') {
			this.jobGuard(creep);
		} else if (creep.memory.job == 'attackRanged') {
			this.jobAttackRanged(creep);
		}
	},
	jobAttack: function(creep) {
		if (creep.pos.roomName == creep.memory.targetRoom) {
			let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
			let hostileTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: s=>s.structureType == STRUCTURE_TOWER});
			let target = creep.pos.findClosestByPath(hostileCreeps.concat(hostileTowers));
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
			}
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
			}
			if(target) {
				creep.attack(target);
				creep.moveTo(target);
			} else {
				creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
			}
		} else {
			creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
		}
	},
	jobAttackRanged: function (creep) {
		if (creep.pos.roomName == creep.memory.targetRoom) {
			let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
			let hostileTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: s=>s.structureType == STRUCTURE_TOWER});
			let target = creep.pos.findClosestByPath(hostileCreeps.concat(hostileTowers));
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
			}
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
			}
			if(target) {
				let err = creep.rangedAttack(target);
				if (creep.pos.getRangeTo(target) < 3) {
					let path = PathFinder.search(creep.pos, {pos:target.pos, range:3}, {flee:true});
					creep.moveByPath(path.path);
				} else if (creep.pos.getRangeTo(target) > 3) {
					creep.moveTo(target);
				}
				if (creep.hits < creep.hitsMax) {
					creep.heal(creep);
				}
			} else {
				creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
			}
		} else {
			creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
		}
	},
	jobGuard: function (creep) {
		var target = Game.getObjectById(creep.memory.targetId);
		if (!target) {
			for (let r in Memory.ownedRooms) {
				for (let room of Memory.ownedRooms[r]) {
					if (Game.rooms[room] && !target) {
						let possibleTargets = Game.rooms[room].find(FIND_HOSTILE_CREEPS);
						if (possibleTargets.length > 0) {
							target = possibleTargets[0];
							creep.memory.targetId = target.id;
						}
					}
				}
			}
		}
		if (target) {
			if (creep.attack(target) != OK) {
				creep.heal(creep);
			}
			creep.moveTo(target);
		} else if (creep.hits < creep.hitsMax) {
			creep.heal(creep);
		}
	}
};
