module.exports = {

	run: function (creep) {
		if (creep.memory.job === 'attack') {
			this.jobAttack(creep);
		} else if (creep.memory.job === 'guard') {
			this.jobGuard(creep);
		} else if (creep.memory.job === 'attackRanged') {
			this.jobAttackRanged(creep);
		} else if (creep.memory.job === 'healer') {
			this.jobHealer(creep);
		} else {
			log(`${creep.name} Error with job memory`);
		}
	},
	jobAttack: function(creep) {
		if (Game.flags.squad && creep.pos.roomName != Game.flags.squad.pos.roomName) {
			creep.moveTo(Game.flags.squad.pos, {range:2});
		} else if (creep.pos.roomName === creep.memory.targetRoom || (Game.flags.squad && creep.pos.roomName === Game.flags.squad.pos.roomName)) {
			let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
			let hostileTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER});
			let target = creep.pos.findClosestByPath(hostileCreeps.concat(hostileTowers));
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
			}
			if (!target) {
				let flags = creep.room.find(FIND_FLAGS, {filter: f=> f.name.split(" ")[0] === 'target'})
				if (flags.length) {
					target = flags[0].pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)
				} else {
					target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
				}
			}
			if (!target) {
				target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType:STRUCTURE_WALL}})
			}
			if (target) {
				creep.attack(target);
				creep.moveTo(target);
			} else if (Game.flags.squad) {
				creep.moveTo(Game.flags.squad.pos, {range:2});
			} else {
				creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
			}
		} else {
			creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
		}
	},
	jobAttackRanged: function (creep) {
		if (Game.flags.squad && creep.pos.roomName != Game.flags.squad.pos.roomName) {
			creep.moveTo(Game.flags.squad.pos, {range:2});
		} else if (creep.pos.roomName === creep.memory.targetRoom || (Game.flags.squad && creep.pos.roomName === Game.flags.squad.pos.roomName)) {
			let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
			let hostileTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER});
			let target = creep.pos.findClosestByPath(hostileCreeps.concat(hostileTowers));
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
			}
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
			}
			if(target) {
				creep.rangedAttack(target);
				if (creep.pos.getRangeTo(target) > 3 || (target instanceof Creep && (target.getActiveBodyparts(ATTACK) === 0))) {
					creep.moveTo(target);
				} else if (creep.pos.getRangeTo(target) < 3) {
					let path = PathFinder.search(creep.pos, {pos:target.pos, range:3}, {flee:true});
					creep.moveByPath(path.path);
				}
			} else if (Game.flags.squad) {
				creep.moveTo(Game.flags.squad.pos, {range:2});
			} else {
				creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
			}
		} else {
			creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
		}
		if (creep.hits < creep.hitsMax) {
			creep.heal(creep);
		}
	},
	jobHealer: function(creep) {
		if (Game.flags.squad && creep.pos.roomName != Game.flags.squad.pos.roomName) {
			creep.moveTo(Game.flags.squad.pos, {range:2});
		} else if (creep.pos.roomName === creep.memory.targetRoom || (Game.flags.squad && creep.pos.roomName === Game.flags.squad.pos.roomName)) {
			let target = _.min(creep.pos.findInRange(FIND_MY_CREEPS, 3, {filter: c=>c.hits < c.hitsMax}), 'hits')
			if (target != Infinity) {
				if (creep.hits === creep.hitsMax) {
					if (creep.pos.inRangeTo(target, 1)) {
						creep.heal(target)
					} else {
						creep.rangedHeal(target)
					}
				}
				creep.moveTo(target)
			} else if (Game.flags.squad) {
				creep.moveTo(Game.flags.squad, {range:2})
			}
			if (creep.hits < creep.hitsMax) {
				creep.heal(creep)
			}
		} else {
			creep.moveTo(new RoomPosition(25,25,creep.memory.targetRoom), {range: 22});
		}
	},
	jobGuard: function (creep) {
		var target = Game.getObjectById(creep.memory.targetId);
		var targetRoom = creep.memory.targetRoom;
		if (!target) {
			for (let room of Empire.getOwnedRooms()) {
				let possibleTargets = room.find(FIND_HOSTILE_CREEPS);
				if (possibleTargets.length > 0) {
					target = possibleTargets[0];
					creep.memory.targetId = target.id;
				}
			}
		}

		if (!target && !targetRoom) {
			let best = {room:null, score:Infinity}
			for (let room of Memory.dangerRooms) {
				let score = _.size(Game.map.findRoute(creep.room.name, room))
				if (score < best.score) {
					best.score = score;
					best.room = room
				}
			}
			if (best.room) {
				targetRoom = best.room;
				creep.memory.targetRoom = best.room;
			}
		}

		if (target) {
			creep.rangedAttack(target);
			if (creep.hits < creep.hitsMax) {
				creep.heal(creep);
			}
			creep.moveTo(target);
		} else if (creep.hits < creep.hitsMax) {
			creep.heal(creep);
		}
		if (targetRoom && !target) {
			if (creep.room.name !== targetRoom) {
				creep.moveTo(new RoomPosition(25,25,targetRoom), {range:22})
			}
		}
	}
};
