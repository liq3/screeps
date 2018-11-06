module.exports = {
    sumCreeps: function (role, room) {
       if (room === undefined) {
           return _.filter(Game.creeps, c => c.memory.role === role).length;
       } else {
           return room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role === role}).length;
       }
   },

    spawnCreepsTest: function(room) {
        let spawn = room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_SPAWN && !s.spawning})[0]
        if (!spawn) {
            return
        }

        if (!room.memory.spawnCensus) {
            room.memory.spawnCensus = this.createSpawnCensus(room);
        }

        let spawnCensus = room.memory.spawnCensus;

        var RCL = room.controller.level;
        let numberHarvesters = this.sumCreeps('harvester', room);
        let numberSpawnHelpers = this.sumCreeps('spawnHelper', room);
        let numberGuards = _.filter(Game.creeps, c => c.memory.job === 'guard').length;
        let numberMiners = this.sumCreeps('miner', room)
        let numberHaulers = this.sumCreeps('hauler', room)
        let numberBuilders = this.sumCreeps ('builder', room);
        let numberPraisers = this.sumCreeps('praiser', room);

        let transportCapacity = 0;
        for (let creep of _.filter(Game.creeps, c => c.memory.role === 'hauler' && c.memory.bossRoom === room.name)) {
            transportCapacity += creep.carryCapacity;
        }
        let desiredTransportCapacity = 0;
        let skip = false;
        for (let entry of spawnCensus) {
            if (skip) {
                continue;
            }
            if (entry.role === 'hauler' && entry.design === 'small') {
                if (entry.amount > numberHaulers) {
                    this.createCreep(spawn, 'H', {role:'hauler', design:'small', bossRoom:room.name});
                    break;
                }
            } else if (entry.role === 'builder') {
                if (entry.amount > numberBuilders) {
                    this.createCreep(spawn, 'B', {role:'builder', bossRoom:room.name});
                    break;
                }
            } else if (entry.role === 'transportCapacity') {
                desiredTransportCapacity += entry.amount;
                if (desiredTransportCapacity < transportCapacity) {
                    this.createCreep(spawn, 'H', {role:'hauler', bossRoom:room.name});
                    break;
                }
            } else if (entry.role === 'harvester') {
                let source = Game.getObjectById(entry.target)
                let harvester = _.filter(Game.creeps, c => c.memory.sourceId === source.id && c.memory.role === 'harvester');
                if (harvester.length === 0
                    || (harvester.length === 1 && harvester[0].ticksToLive < ((Empire.getPathCost(firstSpawn.id, entry.target)+11)*3))) {
                    if (!(Memory.dangerRooms.includes(source.pos.roomName))) {
                        this.createCreep(spawn, 'HV', {role:'harvester',sourceId:entry.target});
                        break;
                    } else {
                        skip = true;
                    }
                }
            } else if (entry.role === 'miner') {
                if (entry.amount > numberMiners) {
                    this.createCreep(spawn, 'M', {role:'miner'});
                    break;
                }
            } else if (entry.role === 'claimer') {
                if (entry.claimTarget) {
                    this.createCreep(spawn, "CLAIM THE ROOM", {role: 'claimer', claimRoom:entry.claimTarget});
                    break;
                } else {
                    this.createCreep(spawn, 'C', {role:'claimer', targetRoom: entry.reserveTarget});
                    break;
                }
            } else if (entry.role === 'combat') {
                let name = {healer:'CH', attack:'A', attackRanged:'AR'}[entry.job]
                this.createCreep(spawn, name, {role:'combat', job:entry.job, targetRoom:entry.target}, entry.parts);
            } else if (entry.role === 'decoy') {
                this.createCreep(spawn, 'D', {role:'decoy', targetRoom:entry.target});
            }
        }

        //(miners.length === 0 || (miners.length === 1 && miners[0].ticksToLive < ((pathCost+11)*3))) &
        //
    },

    createSpawnCensus: function(room) {
        let spawnCensus = [{role:'hauler', num:2, design:'small'}];
        var RCL = room.controller.level;
        let numberHarvesters = this.sumCreeps('harvester', room);
        let numberSpawnHelpers = this.sumCreeps('spawnHelper', room);
        let numberGuards = _.filter(Game.creeps, c => c.memory.job === 'guard').length;
        let numberMiners = this.sumCreeps('miner', room)
        let numberHaulers = this.sumCreeps('hauler', room)
        let numberBuilders = this.sumCreeps ('builder', room);
        let numberPraisers = this.sumCreeps('praiser', room);

        let firstSpawn = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN}})[0]
        let scoutTarget;
        let harvesterTargetId = null;
        let spawnHauler = false;
        let sourceList = [];
        for (let r of room.getRoomNames()) {
            if (Game.rooms[r] === undefined && scoutTarget === undefined
                    && _.filter(Game.creeps, c => c.memory.role === 'scout' && c.memory.targetPos.roomName === r).length === 0) {
                scoutTarget = r;
            } else if (Game.rooms[r]) {
                for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                    let pathCost = Empire.getPathCost(firstSpawn.id, source.id)
                    sourceList.push({source:source, pathCost:pathCost});
                }
            }
        }

        sourceList.sort((a,b) => a.pathCost - b.pathCost );
        let numberContainers = 0;
        for (let {source,pathCost} of sourceList) {
            spawnCensus.push({role:'harvester', target:source.id});
            if (source.container) {
                spawnCensus.push({role:'transportCapacity', amount:Math.ceil(2 * pathCost * source.energyCapacity / ENERGY_REGEN_TIME)});
            }
        }

        if (numberPraisers > 0) {
            let pathCost = Empire.getPathCost(firstSpawn.id, room.controller.id)
            for (let praiser of _.filter(Game.creeps, {filter: c => c.memory.role === 'praiser'})) {
                spawnCensus.push({role:'transportCapacity', amount:2 * pathCost * praiser.getActiveBodyparts(WORK)});
            }
        }

        if (room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_EXTRACTOR}}).length) {
            let mineral = room.find(FIND_MINERALS)[0];
            let mineralContainer = mineral.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType:STRUCTURE_CONTAINER}})[0]
            if (mineralContainer && mineral.mineralAmount > 0) {
                let pathCost = Empire.getPathCost(firstSpawn.id, mineral.id)
                let miners = _.filter(Game.creeps, {filter: c => c.memory.role === 'miner'})
                for (let miner of miners) {
                    spawnCensus.push({role:'transportCapacity', amount:2 * pathCost * miner.getActiveBodyparts(WORK) / 5});
                }

                let spots = 0
                let terrain = room.getTerrain()
                for (let x = mineral.pos.x-1; x < mineral.pos.x+2; x++) {
                    for (let y = mineral.pos.y-1; y < mineral.pos.y+2; y++) {
                        if (terrain.get(x,y) != TERRAIN_MASK_WALL) {
                            spots += 1
                        }
                    }
                }
                spawnCensus.push({role:'miner', amount:spots})
            }
        }

        if (RCL > 4) {
            for (let creep of room.find(FIND_MY_CREEPS, {filter: c=>c.memory.role === 'hauler' && c.carryCapacity < 200})) {
                //creep.recycle()
            }
        }

        let reserveTargetRoom = null;
        for (let r of room.getRoomNames()) {
            if (Game.rooms[r] && !Game.rooms[r].controller.my) {
                let a = _.filter(Game.creeps, c => c.memory.role === 'claimer' && c.memory.targetRoom === r).length;
                if (((a < 1 && !Game.rooms[r].controller.reservation) || (Game.rooms[r].controller.reservation &&
                    ((a < 1 && Game.rooms[r].controller.reservation.ticksToEnd < 4000)
                    || (a < 2 && Game.rooms[r].controller.reservation.ticksToEnd < 4500 && RCL < 5)))) && !(Memory.dangerRooms.includes(r))) {
                    spawnCensus.push({role:'claimer', reserveTarget:r, priority:10})
                    break;
                }
            }
        }

        let searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name === 'claim');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
            itr = Game.rooms[searchRooms[i]]
            if (itr && itr.controller.my && itr.controller.level >= 1) {
                itr.createConstructionSite(Game.flags.claim.pos, STRUCTURE_SPAWN)
                itr.memory.supportNewRoom = Game.flags.claim.room.name
                Game.flags.claim.remove()
            }
        }
        let claimTargetRoom = null;
        for (let r of searchRooms) {
            let trans = _.filter(Game.creeps, c => c.memory.claimRoom === r && c.memory.role === 'claimer').length;
            if (trans === 0) {
                spawnCensus.push({role:'claimer', claimTarget:r, priority:5})
                break;
            }
        }

        function processAttackFlag(name) {
            let spawnAttacker = false;
            let targetRoom;
            searchRooms = [];
            let attackFlags = _.filter(Game.flags, f => f.name.split(" ")[0] === name);
            let desiredAttackers = [];
            for (let i in attackFlags) {
                let flagName = attackFlags[i].name.split(" ");
                if (flagName.length > 1) {
                    let num = parseInt(flagName[1]);
                    if (num) {
                        desiredAttackers[i] = num;
                    }
                } else {
                    desiredAttackers[i] = 1;
                }
                searchRooms[i] = attackFlags[i].pos.roomName;
            }
            for (let i in searchRooms) {
                let r = searchRooms[i];
                let attackers = _.filter(Game.creeps, c => c.memory.targetRoom === r && c.memory.role === 'combat' && c.memory.job === name).length;
                if (attackers < desiredAttackers[i]) {
                    spawnAttacker = true;
                    targetRoom = r;
                    break;
                }
            }
            if (spawnAttacker) {
                return targetRoom
            } else {
                return
            }
        }

        let attackerTargetRoom = processAttackFlag("attack")
        if (!attackerTargetRoom) {
            var attackerRangedTargetRoom = processAttackFlag("attackRanged")
            if (!attackerRangedTargetRoom) {
                var healerTargetRoom = processAttackFlag("healer")
                if (healerTargetRoom) {
                    spawnCensus.push({role:'combat', job:'heal',  target:healerTargetRoom, priority:1});
                }
            } else {
                spawnCensus.push({role:'combat', job:'attackRanged',  target:attackerRangedTargetRoom, priority:1});
            }
        } else {
            spawnCensus.push({role:'combat', job:'attack', target:attackerTargetRoom,  priority:1});
        }

        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] === 'harass');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        let attackerParts;
        for (let r of searchRooms) {
            let attackers = _.filter(Game.creeps, c => c.memory.targetRoom === r && c.memory.job === 'attack' && c.memory.role === `combat`).length;
            if (attackers === 0) {
                spawnCensus.push({role:'combat', job:'attack', parts:1, target:r, priority:1});
                break;
            }
        }

        searchRooms = [];
        searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] === 'decoy');
        for (let i in searchRooms) {
            searchRooms[i] = searchRooms[i].pos.roomName;
        }
        let decoyTargetRoom;
        for (let r of searchRooms) {
            spawnCensus.push({role:'decoy', target:r, priority:1});
            break;
        }

        let upgradeWorkParts = 0;
        for (let creep of room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role === 'praiser'})) {
            for (let part in creep.body) {
                if (creep.body[part].type === WORK) {
                    upgradeWorkParts += 1;
                }
            }
        }

        let desiredBuilders = 1;
        for (let r of room.getRoomNames()) {
            if (room.find(FIND_CONSTRUCTION_SITES).length > 0) {
                desiredBuilders = 3;
                break
            }
        }
        spawnCensus.push({role:'builder', amount:desiredBuilders})

        if (desiredBuilders === 1 && numberBuilders > desiredBuilders) {
            best = null
            for (let creep of room.find(FIND_MY_CREEPS, {filter: c => c.memory.role === 'builder'})) {
                if (best === null || best.ticksToLive < creep.ticksToLive) {
                    if (best != null) {
                        best.recycle()
                    }
                    best = creep
                } else {
                    creep.recycle()
                }
            }
        }

        if (room.memory.supportNewRoom !== undefined) {
            if (Game.rooms[room.memory.supportNewroom] && Game.rooms[room.memory.supportNewRoom].find(FIND_MY_STRUCTURES, {filter: s=> s.structureType === 'STRUCTURE_SPAWN'}).length > 0) {
                delete room.memory.supportNewRoom
            } else {
                var numberNewRoomBuilders = _.filter(Game.creeps, c => c.memory.role === 'builder' && c.memory.bossRoom === room.memory.supportNewRoom).length
            }
        }

        return spawnCensus;
    },

    createCreep: function(spawn, name, data, partNumber) {
        let parts = [];
        if (data.role === 'harvester') {
            if (spawn.room.energyCapacityAvailable < 550) {
                let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 50) / 100);
                parts = Array(Math.min(6,numberParts)).fill(WORK);
                parts = parts.concat([MOVE]);
            } else {
                let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 150) / 100);
                parts = Array(Math.min(6,numberParts)).fill(WORK);
                parts = parts.concat([CARRY,MOVE,MOVE]);
            }
        } else if (data.role === 'praiser') {
            let cost = 100;
            let maxCost = spawn.room.energyCapacityAvailable;
            parts = [];
            while (cost < maxCost && parts.length < 48) {
                for (let i = 0; i < 10 && cost+100 <= maxCost; i++, cost += 100) {
                    parts.unshift(WORK);
                }
                if (cost < maxCost) {
                    parts.push(MOVE);
                    cost += 50;
                }
                if (cost< maxCost) {
                    parts.push(CARRY);
                    cost += 50;
                }
            }
            parts.push(CARRY,MOVE);
        } else if (data.role === 'hauler') {
            if (data.design === 'small') {
                parts = spawn.room.controller.level < 3 ? [WORK, MOVE, MOVE, CARRY] : [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
                delete data.design;
            } else if (spawn.room.energyCapacityAvailable >= 550) {
                let numberParts = Math.min(15, Math.floor((spawn.room.energyCapacityAvailable - 200) / 150));
                parts = [WORK]
                parts = parts.concat(Array(numberParts*2+1).fill(CARRY));
                parts = parts.concat(Array(numberParts+1).fill(MOVE));
            } else if (spawn.room.controller.level >= 2) {
                let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 100);
                parts = parts.concat(Array(numberParts).fill(CARRY));
                parts = parts.concat(Array(numberParts).fill(MOVE));
            } else {
                let numberParts = Math.floor((spawn.room.energyCapacityAvailable - 150) / 100);
                parts = [WORK, MOVE]
                parts = parts.concat(Array(numberParts).fill(CARRY));
                parts = parts.concat(Array(numberParts).fill(MOVE));
            }
        } else if (data.role === 'spawnHelper') {
            let numberParts = Math.min(10, Math.floor(spawn.room.energyCapacityAvailable / 150));
            parts = Array(numberParts).fill(CARRY);
            parts = parts.concat(Array(numberParts).fill(CARRY));
            parts = parts.concat(Array(numberParts).fill(MOVE));
            data.gathering = true;
        } else if (data.role === 'decoy') {
            parts = [TOUGH,MOVE];
            // let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 100);
            // for (let i = 0; i < Math.min(8,numberParts); i++) {
            //     parts = parts.concat([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE]);
            // }
        } else if (data.role === 'combat') {
            if (data.job === 'attack') {
                let numberParts = partNumber ? partNumber : Math.floor(spawn.room.energyCapacityAvailable / 130);
                for (let i = 0; i < Math.min(numberParts, 5); i++) {
                    parts = parts.concat([ATTACK,MOVE]);
                }
            } else if (data.job === 'attackRanged' || data.job === 'guard') {
                let numberParts = Math.min(16, Math.floor((spawn.room.energyCapacityAvailable - 300) / 260));
                parts = Array(numberParts).fill(TOUGH);
                parts = parts.concat(Array(numberParts*2+1).fill(MOVE));
                parts = parts.concat(Array(numberParts-1).fill(RANGED_ATTACK));
                parts.push(HEAL,RANGED_ATTACK);
            }  else if (data.job === 'guard') {
                let numberParts = partNumber ? partNumber : Math.min( 23, Math.floor((spawn.room.energyCapacityAvailable - 450) / 130));
                parts = Array(numberParts+1).fill(MOVE);
                parts = parts.concat(Array(numberParts).fill(ATTACK));
                parts.push(HEAL,RANGED_ATTACK);
            } else if (data.job === 'healer') {
                let numberParts = Math.floor(spawn.room.energyCapacityAvailable / 300)
                parts = Array(numberParts).fill(MOVE)
                parts = parts.concat(Array(numberParts).fill(HEAL))
            }
        } else if (data.role === 'scout' || data.role === 'geologist') {
            parts = [MOVE];
        } else if (data.role === 'claimer') {
            if (data.claimRoom) {
                parts = [MOVE,MOVE,MOVE,MOVE,MOVE,CLAIM]
            } else {
                parts = spawn.room.energyCapacityAvailable < 1450 ? [CLAIM,MOVE,MOVE,MOVE] : [CLAIM,CLAIM,MOVE,MOVE,MOVE,MOVE,MOVE];
            }
        } else if (data.role === 'miner') {
            let numberParts = Math.min(9, Math.floor((spawn.room.energyCapacityAvailable - 50) / 450));
            parts = Array(numberParts*4).fill(WORK);
            parts.push(CARRY)
            parts = parts.concat(Array(numberParts).fill(MOVE))
        } else { // builder mainly
            if (spawn.room.energyCapacityAvailable < 350) {
                parts = [WORK, CARRY, CARRY, MOVE, MOVE];
            } else {
                let numberParts = Math.min(8, Math.floor(spawn.room.energyCapacityAvailable / 350));
                parts = Array(numberParts).fill(WORK);
                parts = parts.concat(Array(numberParts*2).fill(CARRY));
                parts = parts.concat(Array(numberParts*3).fill(MOVE));
                data.gathering = true;
            }
        }
        error = spawn.createCreep(parts, this.getName(name), data);
        if (typeof(error) === 'string') {
            logStr = `${spawn.room.name} spawning ${error} in ${parts.length*3} ticks with ${spawn.name}. ` + JSON.stringify(data);
            log(logStr);
            delete spawn.room.memory.spanwCensus;
            try {
                Memory.spawnTimes[spawn.id].push({tick:Game.time, time:parts.length*3});
            } catch (err) {
                log(err)
            }
        } else if (error === ERR_INVALID_ARGS) {
            log("Error spawning creep: " + error + JSON.stringify(data) + parts);
        } else if (error === ERR_NAME_EXISTS) {
            log("Error! Trying to spawn creep with same name");
        } else if (error === ERR_NOT_ENOUGH_ENERGY && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
            log("Error! Trying to spawn creep that costs too much" + data.role + parts);
        } else if (error !== ERR_NOT_ENOUGH_ENERGY) {
            log(`Error:${error} spawning creep with ${spawn.name} in ${spawn.room.name}: ${parts} ${JSON.stringify(data)}`)
        }
        return error;
    },

    getName: function(name, num) {
        if (num === undefined) {
            num = 0;
        }
        if (!((name + num) in Game.creeps)) {
            return name + num;
        } else {
            return this.getName(name, num+1);
        }
    },

    spawnCreeps: function(room) {
       let spawn = room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_SPAWN && !s.spawning})[0]
       if (!spawn) {
           return
       }

       function sumCreeps(role, room) {
           if (room === undefined) {
               return _.filter(Game.creeps, c => c.memory.role === role).length;
           } else {
               return room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role === role}).length;
           }
       }

       if (!room.memory.spawnCensus) {
           room.memory.spawnCensus = []
       }

       var RCL = room.controller.level;
       let numberHarvesters = sumCreeps('harvester', room);
       let numberSpawnHelpers = sumCreeps('spawnHelper', room);
       let numberGuards = _.filter(Game.creeps, c => c.memory.job === 'guard').length;
       let numberMiners = sumCreeps('miner', room)
       let numberHaulers = sumCreeps('hauler', room)
       let numberBuilders = sumCreeps ('builder', room);
       let numberPraisers = sumCreeps('praiser', room);

       let firstSpawn = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN}})[0]
       let scoutTarget;
       let harvesterTargetId = null;
       let spawnHauler = false;
       let desiredTransportCapacity = 0;
       let sourceList = [];
       for (let r of room.getRoomNames()) {
           if (Game.rooms[r] === undefined && scoutTarget === undefined
                   && _.filter(Game.creeps, c => c.memory.role === 'scout' && c.memory.targetPos.roomName === r).length === 0) {
               scoutTarget = r;
           } else if (Game.rooms[r]) {
               for (let source of Game.rooms[r].find(FIND_SOURCES)) {
                   let pathCost = Empire.getPathCost(firstSpawn.id, source.id)
                   sourceList.push({source:source, pathCost:pathCost});
               }
           }
       }

       sourceList.sort((a,b) => a.pathCost - b.pathCost );
       let numberContainers = 0;
       for (let {source,pathCost} of sourceList) {
           let miners = _.filter(Game.creeps, c => c.memory.sourceId === source.id && c.memory.role === 'harvester');
           if (harvesterTargetId === null && (miners.length === 0 || (miners.length === 1 && miners[0].ticksToLive < ((pathCost+11)*3))) && !(Memory.dangerRooms.includes(source.pos.roomName))) {
               harvesterTargetId = source.id;
           } else if (miners.length > 0) {
               if (source.container) {
                   desiredTransportCapacity += Math.ceil(2 * pathCost * source.energyCapacity / ENERGY_REGEN_TIME);
                   numberContainers += 1;
               }
           }
       }

       if (numberPraisers > 0) {
           let pathCost = Empire.getPathCost(firstSpawn.id, room.controller.id)
           for (let praiser of _.filter(Game.creeps, {filter: c => c.memory.role === 'praiser'})) {
               desiredTransportCapacity += 2 * pathCost * praiser.getActiveBodyparts(WORK)
           }
       }

       if (room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_EXTRACTOR}}).length) {
           let mineral = room.find(FIND_MINERALS)[0];
           let mineralContainer = mineral.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType:STRUCTURE_CONTAINER}})[0]
           if (mineralContainer && mineral.mineralAmount > 0) {
               let pathCost = Empire.getPathCost(firstSpawn.id, mineral.id)
               let miners = _.filter(Game.creeps, {filter: c => c.memory.role === 'miner'})
               for (let miner of miners) {
                   desiredTransportCapacity += 2 * pathCost * miner.getActiveBodyparts(WORK) / 5
               }

               let spots = 0
               let terrain = room.getTerrain()
               for (let x = mineral.pos.x-1; x < mineral.pos.x+2; x++) {
                   for (let y = mineral.pos.y-1; y < mineral.pos.y+2; y++) {
                       if (terrain.get(x,y) != TERRAIN_MASK_WALL) {
                           spots += 1
                       }
                   }
               }
               if (numberMiners < spots) {
                   var spawnMiner = true
               }
           }
       }

       let transportCapacity = 0;
       for (let creep of _.filter(Game.creeps, c => c.memory.role === 'hauler' && c.memory.bossRoom === room.name)) {
           transportCapacity += creep.carryCapacity;
       }
       if (transportCapacity < desiredTransportCapacity) {
           spawnHauler = true;
       } else if (RCL > 4) {
           for (let creep of room.find(FIND_MY_CREEPS, {filter: c=>c.memory.role === 'hauler' && c.carryCapacity < 200})) {
               //creep.recycle()
           }
       }

       let reserveTargetRoom = null;
       for (let r of room.getRoomNames()) {
           if (Game.rooms[r] && !Game.rooms[r].controller.my) {
               let a = _.filter(Game.creeps, c => c.memory.role === 'claimer' && c.memory.targetRoom === r).length;
               if (((a < 1 && !Game.rooms[r].controller.reservation) || (Game.rooms[r].controller.reservation &&
                   ((a < 1 && Game.rooms[r].controller.reservation.ticksToEnd < 4000)
                   || (a < 2 && Game.rooms[r].controller.reservation.ticksToEnd < 4500 && RCL < 5)))) && !(Memory.dangerRooms.includes(r))) {
                   reserveTargetRoom = r;
                   break;
               }
           }
       }

       let searchRooms = [];
       searchRooms = _.filter(Game.flags, f => f.name === 'claim');
       for (let i in searchRooms) {
           searchRooms[i] = searchRooms[i].pos.roomName;
           itr = Game.rooms[searchRooms[i]]
           if (itr && itr.controller.my && itr.controller.level >= 1) {
               itr.createConstructionSite(Game.flags.claim.pos, STRUCTURE_SPAWN)
               itr.memory.supportNewRoom = Game.flags.claim.room.name
               Game.flags.claim.remove()
           }
       }
       let claimTargetRoom = null;
       for (let r of searchRooms) {
           let trans = _.filter(Game.creeps, c => c.memory.claimRoom === r && c.memory.role === 'claimer').length;
           if (trans === 0) {
               claimTargetRoom = r;
               break;
           }
       }

       function processAttackFlag(name) {
           let spawnAttacker = false;
           let targetRoom;
           searchRooms = [];
           let attackFlags = _.filter(Game.flags, f => f.name.split(" ")[0] === name);
           let desiredAttackers = [];
           for (let i in attackFlags) {
               let flagName = attackFlags[i].name.split(" ");
               if (flagName.length > 1) {
                   let num = parseInt(flagName[1]);
                   if (num) {
                       desiredAttackers[i] = num;
                   }
               } else {
                   desiredAttackers[i] = 1;
               }
               searchRooms[i] = attackFlags[i].pos.roomName;
           }
           for (let i in searchRooms) {
               let r = searchRooms[i];
               let attackers = _.filter(Game.creeps, c => c.memory.targetRoom === r && c.memory.role === 'combat' && c.memory.job === name).length;
               if (attackers < desiredAttackers[i]) {
                   spawnAttacker = true;
                   targetRoom = r;
                   break;
               }
           }
           if (spawnAttacker) {
               return targetRoom
           } else {
               return
           }
       }

       let attackerTargetRoom = processAttackFlag("attack")
       if (!attackerTargetRoom) {
           var attackerRangedTargetRoom = processAttackFlag("attackRanged")
           if (!attackerRangedTargetRoom) {
               var healerTargetRoom = processAttackFlag("healer")
           }
       }

       searchRooms = [];
       searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] === 'harass');
       for (let i in searchRooms) {
           searchRooms[i] = searchRooms[i].pos.roomName;
       }
       let attackerParts;
       for (let r of searchRooms) {
           let attackers = _.filter(Game.creeps, c => c.memory.targetRoom === r && c.memory.job === 'attack' && c.memory.role === `combat`).length;
           if (attackers === 0) {
               spawnAttacker = true;
               attackerTargetRoom = r;
               attackerParts = 1;
               break;
           }
       }



       searchRooms = [];
       searchRooms = _.filter(Game.flags, f => f.name.split(" ")[0] === 'decoy');
       for (let i in searchRooms) {
           searchRooms[i] = searchRooms[i].pos.roomName;
       }
       let decoyTargetRoom;
       for (let r of searchRooms) {
           decoyTargetRoom = r;
           break;
       }

       let upgradeWorkParts = 0;
       for (let creep of room.find(FIND_MY_CREEPS, {filter: c=> c.memory.role === 'praiser'})) {
           for (let part in creep.body) {
               if (creep.body[part].type === WORK) {
                   upgradeWorkParts += 1;
               }
           }
       }

       let desiredBuilders = 1;
       for (let r of room.getRoomNames()) {
           if (room.find(FIND_CONSTRUCTION_SITES).length > 0) {
               desiredBuilders = 3;
               break
           }
       }
       if (desiredBuilders === 1 && numberBuilders > desiredBuilders) {
           best = null
           for (let creep of room.find(FIND_MY_CREEPS, {filter: c => c.memory.role === 'builder'})) {
               if (best === null || best.ticksToLive < creep.ticksToLive) {
                   if (best != null) {
                       best.recycle()
                   }
                   best = creep
               } else {
                   creep.recycle()
               }
           }
       }

       if (room.memory.supportNewRoom !== undefined) {
           if (Game.rooms[room.memory.supportNewroom] && Game.rooms[room.memory.supportNewRoom].find(FIND_MY_STRUCTURES, {filter: s=> s.structureType === 'STRUCTURE_SPAWN'}).length > 0) {
               delete room.memory.supportNewRoom
           } else {
               var numberNewRoomBuilders = _.filter(Game.creeps, c => c.memory.role === 'builder' && c.memory.bossRoom === room.memory.supportNewRoom).length
           }
       }

       if (numberHaulers < 2) {
           this.createCreep(spawn, 'H', {role:'hauler', design:'small', bossRoom:room.name});
       } else if (attackerTargetRoom) {
           this.createCreep(spawn, 'A', {role:'combat',targetRoom:attackerTargetRoom,job:'attack'}, attackerParts);
       } else if (attackerRangedTargetRoom) {
           this.createCreep(spawn, 'AR', {role:'combat',targetRoom:attackerRangedTargetRoom, job:'attackRanged'});
       } else if (healerTargetRoom) {
           this.createCreep(spawn, 'CH', {role:'combat',targetRoom:healerTargetRoom, job:'healer'});
       } else if (scoutTarget) {
           this.createCreep(spawn, 'S', {role:'scout', targetPos:{x:25,y:25,roomName:scoutTarget}})
       } else if (claimTargetRoom) {
           this.createCreep(spawn, "CLAIM THE ROOM", {role: 'claimer', claimRoom:claimTargetRoom});
       } else if (spawnHauler || (room.energyCapacityAvailable < 550 && numberHaulers < 5)) {
           this.createCreep(spawn, 'H', {role:'hauler', bossRoom:room.name});
       } else if (harvesterTargetId && RCL >= 2) {
           this.createCreep(spawn, 'HV', {role:'harvester',sourceId:harvesterTargetId});
       } else if (numberNewRoomBuilders !== undefined && numberNewRoomBuilders < 5) {
           this.createCreep(spawn, 'B', {role:'builder', bossRoom:room.memory.supportNewRoom});
       } else if (numberBuilders < desiredBuilders) {
           this.createCreep(spawn, 'B', {role:'builder', bossRoom:room.name});
       } else if (numberGuards < 3 && Memory.dangerRooms.length > 0) {
           this.createCreep(spawn, 'G', {role:'combat', job:'guard'});
       } else if (numberSpawnHelpers < 1 && ((room.storage && room.storage.store[RESOURCE_ENERGY] > 5000) || room.container)) {
           this.createCreep(spawn, 'SH', {role:'spawnHelper'});
       } else if (reserveTargetRoom && RCL > 2) {
           this.createCreep(spawn, 'C', {role:'claimer', targetRoom: reserveTargetRoom});
       } else if (decoyTargetRoom) {
           this.createCreep(spawn, 'D', {role:'decoy', targetRoom:decoyTargetRoom});
       } else if (spawnMiner) {
           this.createCreep(spawn, 'M', {role:'miner'});
       } else if (((room.storage && numberPraisers < Math.ceil((room.storage.store[RESOURCE_ENERGY]-50000) / (20 * room.energyCapacityAvailable)))
               || room.storage === undefined)
               && room.controller.pos.findInRange(FIND_STRUCTURES, 2, {filter: {structureType:STRUCTURE_CONTAINER}}).length
               && numberPraisers < 3) {
           this.createCreep(spawn, 'SU', {role:'praiser', bossRoom:room.name, finalPos:null});
       } else if (Memory.spawnGeologist > 0) {
           this.createCreep(spawn, 'GEO', {role:'geologist'});
           Memory.spawnGeologist -= 1
       }
   }
};
