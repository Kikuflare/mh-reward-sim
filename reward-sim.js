/*
Monster Hunter 4U Reward Simulator by Kiku


Quest data obtained from:
kiranico.com

Lucky Cat data obtained from:
http://wiki.mh4g.org/data/1435.html

Reward mechanics based on explanations on these pages:
http://gokuroo.blog.fc2.com/blog-entry-41.html
http://www.capcom-unity.com/monster_hunter/go/thread/view/146585/30512213/how-mh4us-reward-system-works


Monster Hunter is a registered trademark of Capcom Co., Ltd. 

*/


function changeRanks() {
    // Populate the dropdown menu for Rank, based on the currently selected quest location
    var locationSelect = document.getElementById("location-select").selectedIndex;
    var rankSelect = document.getElementById("rank-select").options;
    rankSelect.length = 0;
    
    if (locationSelect === 3) {
        document.getElementById("rank-select").disabled = true;
    }
    else {
        document.getElementById("rank-select").disabled = false;
    }

    if (locationSelect === 0) {
        for (var i = 1; i < 11; i++) {
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            rankSelect.add(option)
        }
    }
    else if (locationSelect === 1) {
        for (var i = 1; i < 8; i++) {
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            rankSelect.add(option)
        }
    }
    else if (locationSelect === 2) {
        for (var i = 1; i < 4; i++) {
        var option = document.createElement("option");
        option.value = i + 7;
        option.text = "G" + i;
        rankSelect.add(option)
        }
    }
    else if (locationSelect === 3) {
        var rankSelect = document.getElementById("rank-select").options;
        rankSelect.length = 0;

        var option = document.createElement("option");
        option.value = 0;
        option.text = "N/A";
        rankSelect.add(option)
    }
    
    loadQuests();
}


function loadQuests() {
    // Populate the dropdown menu for quest, based on a combination of the
    // currently selected location and rank
    var location = document.getElementById("location-select").value;
    var rank = document.getElementById("rank-select").value;
    
    var questSelect = document.getElementById("quest-select").options;
    questSelect.length = 0;
    
    for (var i = 0; i < quests.length; i++) {
        if (quests[i].questguild_id === location && quests[i].star === rank) {
            questSelect.add(new Option(quests[i].local_name, quests[i].id));
        }
        else if (quests[i].questguild_id === location && location === "3") {
            questSelect.add(new Option(quests[i].local_name, quests[i].id));
        }
    }
    
    enableSubquest();
}


function enableSubquest() {
    // Check if the current quest has a subquest associated with it, and
    // disable/enable the dropdown menu for subquest
    var quest = document.getElementById("quest-select").value;
    var questObj = getQuest(quest);
    var subquestSelect = document.getElementById("subquest-select");
    
    if (questObj.questsubgoal_id === "1") {
        subquestSelect.value = "0";
        document.getElementById("subquest-select").disabled = true;
    }
    else {
        document.getElementById("subquest-select").disabled = false;
    }
}


function load() {
    changeRanks();
}


/*
Rewards, line A:
1st     If the item list contains an item with 100% chance, select it as slot 1,
        otherwise, select a random item from the item list
2nd     Select a random item from the item list
3rd     Select a random item from the item list
4th     Select a random item from the item list
5th     69% of selecting another item from the item list
6th     69% of selecting another item from the item list, if 5th tile was successful
7th     69% of selecting another item from the item list, if 6th tile was successful
8th     69% of selecting another item from the item list, if 7th tile was successful

The same applies for line B and subquest rewards, except that line B has only two
guaranteed slots and subquests with only 1 guaranteed slot. Subquest rewards only go
up to a maximum of 4 slots total.

*/

//Slot chance (out of 32)
var CHANCE0 = 22  // Fate+0  (Normal)
var CHANCE1 = 8   // Fate-10 (Bad Luck)
var CHANCE2 = 16  // Fate-15 (Horrible Luck)
var CHANCE3 = 25  // Fate+10 (Good Luck)
var CHANCE4 = 28  // Fate+15 (Great Luck)
var CHANCE5 = 31  // Fate+20 (Miraculous Luck)

var FIXED_REWARD = 1   // Number of guaranteed item slots for 100% items
var FIXED_SLOTS_A = 4  // Number of guaranteed item slots for line A rewards
var FIXED_SLOTS_B = 2  // Number of guaranteed item slots for line B rewards
var FIXED_SLOTS_C = 1  // Number of guaranteed item slots for subquest rewards
var TOTAL_SLOTS_A = 8  // Slots for line A rewards
var TOTAL_SLOTS_B = 8  // Slots for line B rewards
var TOTAL_SLOTS_C = 4  // Slots for subquest rewards


function rewardSim() {
    /* quest_id is a unique integer that identifies a specific quest. Valid ids
     * correspond to the values used by kiranico.com.
     *
     * This function prints a sample of possible rewards from a quest.
     */
    var questId = document.getElementById("quest-select").value;
    var chance = document.getElementById("fate-select").value;
    var luckyCat = document.getElementById("luckycat-select").value;
    
    var subquestCompleted = document.getElementById("subquest-select").value;
    
    var lineA = calculateRewards(questId, "A", chance, luckyCat);
    var lineB = calculateRewards(questId, "B", chance, luckyCat);
    var lineC = calculateRewards(questId, "C", chance, luckyCat);

    var rewardBox = document.getElementById("reward-box");
    
    var rewards = "";
    
    if (lineA.length > 0) {
        rewards += "<strong>Line A</strong><br>"
        for (i = 0; i < lineA.length; i++) {
            rewards = rewards + lineA[i] + "<br>"
        }
    }
    
    if (lineB.length > 0) {
        rewards += "<strong>Line B</strong><br>"
        for (i = 0; i < lineB.length; i++) {
            rewards = rewards + lineB[i] + "<br>"
        }
    }
    
    if (lineC.length > 0 && subquestCompleted === "1") {
        rewards += "<strong>Subquest Rewards</strong><br>"
        for (i = 0; i < lineC.length; i++) {
            rewards = rewards + lineC[i] + "<br>"
        }
    }
    
    rewardBox.innerHTML = rewards;
}


function getQuest(id) {
    /* Search algorithm for finding the appropriate quest from the quest list
     * -Assume that the quest list is sorted according to id
     * -Return the quest as a json object
     * 
     * 1: Check that the id is within bounds of the quest list size, if not,
     *    perform a linear search backwards through the list
     * 2: If the id is within bounds of the quest list size, then search
     *    forward if the quest id found is lower than the argument id,
     *    backward if higher
     */
    var idInt = parseInt(id);
    
    if (idInt >= quests.length) {
        for (var i = quests.length - 1; i >= 0; i--) {
            if (quests[i].id === id) {
                return quests[i];
            }
        }
    }
    else if (quests[idInt].id === id) {
        return quests[idInt];
    }
    // Search forward
    else if (parseInt(quests[idInt].id) < idInt) {
        for (var i = idInt + 1; i < quests.length; i++) {
            if (quests[i].id === id) {
                return quests[i];
            }
        }
    }
    // Search backward
    else if (parseInt(quests[idInt].id) > idInt) {
        for (var i = idInt - 1; i >= 0; i--) {
            if (quests[i].id === id) {
                return quests[i];
            }
        }
    } 
}


function createRewardTable(questData, type) {
    /* Takes a quest json object and generates the reward table based on the
     * line specified by type
     * -Returns an array of items with the occurrence of each item equal to
     *  the number defined by percentage 
     */
    var rewardTable = []
    
    /* Exclude items that have 100% reward percentage, because those items are
     * the guaranteed reward for quests with a fixed first slot */
    for (i = 0; i < questData.items.length; i++) {
        if (questData.items[i].type === type && questData.items[i].percentage !== "100") {
            var reward = questData.items[i].local_name + " x " + questData.items[i].quantity;
            for (var j = 0; j < parseInt(questData.items[i].percentage); j++) {
                rewardTable.push(reward);
            }
        }
    }
    
    return rewardTable;
}


function calculateRewards(id, type, chance, luckyCat) {
    /* Line A is guaranteed 4 reward slots (up to 4 more random slots for a total of 8)
     * Line B is guaranteed 2 reward slots (up to 6 more random slots for a total of 8)
     * Subquest rewards are guaranteed 1 reward slot (up to 3 more random slots for a total of 4)
     * If a particular line has an item listed with 100% chance, it takes up
     * one of the fixed slots for that line
     * 
     * -id refers to the quest id 
     * -type refers to the line of the reward, either "A", "B", or "C"
     * -Returns an array of randomized rewards
     */
    var rewards = []
    
    var questObj = getQuest(id);
    var rewardTable = createRewardTable(questObj, type);
    
    // First, determine how many rewards are given for the quest (affected by
    // Fate and Lucky Cat)
    var rewardCount = calculateRewardSlots(type, chance, luckyCat);
    
    // Determine if there is a 100% drop for the line, put it in the reward list
    for (i = 0; i < questObj.items.length; i++) {
        if (questObj.items[i].type === type && questObj.items[i].percentage === "100") {
            var reward = questObj.items[i].local_name + " x " + questObj.items[i].quantity;
            rewards.push(reward);
            rewardCount -= 1;
            break;
        }
    }
    
    // Roll for the remaining items
    if (rewardTable.length > 0) {
        for (i = 0; i < rewardCount; i++) {
            rng = Math.floor(Math.random()*rewardTable.length);
            rewards.push(rewardTable[rng]);
        }
    }
    
    return rewards; 
}


function calculateRewardSlots(type, chance, luckyCat) {
    /* -Assume that the arguments supplied are all strings
     * -Bonus chance to get one slot if failed to roll on a previous slot
     * -50% for Lucky Cat, 100% for Ultra Lucky Cat
     * -FATE AND LUCKY CAT DO NOT AFFECT SUBQUEST REWARDS
     */
    var rewardCount;
    var remainingSlots;
    var chanceInt = parseInt(chance);
    
    if (type == "A") {
        rewardCount = 4;
        remainingSlots = TOTAL_SLOTS_A - FIXED_SLOTS_A;
    }
    else if (type == "B") {
        rewardCount = 2;
        remainingSlots = TOTAL_SLOTS_B - FIXED_SLOTS_B;
    }
    else if (type = "C") {
        rewardCount = 1;
        remainingSlots = TOTAL_SLOTS_C - FIXED_SLOTS_C;
        chanceInt = CHANCE0;
    }
    
    for (var i = 0; i < remainingSlots; i++) {
        rng = randomInt(1, 33);
        if (rng <= chanceInt) {
            rewardCount += 1;
        }
        else {
            if (luckyCat === "1" && type !== "C") {
                if (Math.random() >= 0.5) {
                    rewardCount += 1;
                }
            }
            else if (luckyCat === "2" && type !== "C") {
                rewardCount += 1;
            }
            break;
        }
    }
    
    return rewardCount;
}


function randomInt(min, max) {
    // Function taken from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    return Math.floor(Math.random() * (max - min)) + min;
}


window.onload = load;