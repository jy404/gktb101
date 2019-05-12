var mysql = require('mysql');
var connection;
const data = require('../lib/data.js');

function openConnection() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'gktb',
        password: 'ggyy@GKTB101',
        port: '3306',
        database: 'GKTB'
    });
    connection.connect();
}

function closeConnection() {
    connection.end();
}

function formatScore(score) {
    if (score) {
        return score;
    }
    return '--';
}

exports.home = function (req, res) {
    res.render('home');
};

exports.test = function (req, res) {
    openConnection();
    var sql = 'SELECT * FROM location ORDER BY location_order';

    connection.query(sql, function (err, results) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
        }
        var locationList = [];
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var location = {};
                location.name = results[i].location_name;
                location.code = results[i].location_code;
                location.order = results[i].location_order;
                locationList.push(location);
            }
        }
        res.render('test', {location: locationList, myLocations: data.getLocations()});
    });
    closeConnection();
};

exports.location_line = function (req, res) {
    var code = req.query.location;
    var whereCondition = null;
    if (code) {
        whereCondition = 'WHERE location_batch_line.registration_location_code = ? ';
    }

    openConnection();
    var sql = 'SELECT * FROM location_batch_line left join location ' +
        'on location_batch_line.registration_location_code = location.location_code ';
    if (whereCondition) {
        sql = sql + whereCondition;
    }
    sql = sql + 'ORDER BY year DESC';

    connection.query(sql, code, function (err, results) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
        }
        var scorelineList = [];
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var scoreline = {};
                scoreline.year = results[i].year;
                scoreline.no = i + 1;
                scoreline.location = results[i].location_name;
                scoreline.student_type = results[i].student_type;
                scoreline.batch = results[i].batch;
                scoreline.socre = results[i].score_line;
                scorelineList.push(scoreline);
            }
        }
        res.render('score_line_location', {location: data.getLocations(), scoreline: scorelineList});
    });
    closeConnection();
};

exports.setGoal = function (req, res) {
    var i, length = 0;
    var temp = {};

    if (!req.session.usersetting) {
        req.session.usersetting = {};
        req.session.usersetting.sl = -1;
    }
    if (req.query.sl) {
        req.session.usersetting.sl = req.query.sl;
    }

    var locations = data.getLocations();
    var studentLocs = [];
    var universityLocs = [];
    var selectedUniversityLoc;
    if (locations) {
        length = locations.length;
    }
    for (i = 0; i < length; i++) {
        var location = locations[i];
        temp = {};
        temp.name = location.name;
        temp.code = location.code;
        if (temp.code == req.session.usersetting.sl) {
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
        studentLocs.push(temp);

        if (i == 0) {
            selectedUniversityLoc = location.code;
        }
        var temp2 = {};
        temp2.name = location.name;
        temp2.code = location.code;
        if (temp2.code == req.query.ul) {
            temp2.selected = ' selected';
            selectedUniversityLoc = temp2.code;
        } else {
            temp2.selected = '';
        }
        universityLocs.push(temp2);
    }

    var types = data.getStudentTypes();
    if (req.query.type) {
        for (i = 0; i < types.length; i++) {
            var type = types[i];
            if (type.code == req.query.type) {
                type.selected = ' selected';
            } else {
                type.selected = '';
            }
        }
    }

    var majorClasses = data.getMajorClasses();
    var myMajorClasses = [];
    length = 0;
    var majorClassCode;
    if (majorClasses) {
        length = majorClasses.length;
    }
    for (i = 0; i < length; i++) {
        var majorClass = majorClasses[i];
        temp = {};
        temp.code = majorClass.code;
        temp.name = majorClass.name;
        if (i == 0) {
            majorClassCode = temp.code;
        }
        if (temp.code == req.query.class) {
            temp.selected = ' selected';
            majorClassCode = majorClass.code;
        } else {
            temp.selected = '';
        }
        myMajorClasses.push(temp);
    }

    var subClasses = data.getMajorSubClasses(majorClassCode);
    var subClassCode;
    if (subClasses && subClasses.length > 0) {
        subClassCode = subClasses[0].code;
        if (req.query.subClass) {
            for (i = 0; i < subClasses.length; i++) {
                var subClass = subClasses[i];
                if (subClass.code == req.query.subClass) {
                    subClass.selected = ' selected';
                    subClassCode = subClass.code;
                } else {
                    subClass.selected = '';
                }
            }
        }
    }

    var majors = data.getMajors(subClassCode);
    var myUniversities = data.getUniversities(selectedUniversityLoc);

    var isShowEmptyResult = false;
    var scoreLine = [];
    if (req.query.sl && majorClassCode && subClassCode && req.query.ul) {
        var majorLines = [];
        var universityLines = [];
        majorLines = data.getMajorLine(req.query.sl, subClassCode, req.query.ul);
        universityLines = data.getUniversityLine(req.query.sl, req.query.ul);
        var j = 0, lengthUniversity = 0, lengthMajor = 0;
        if (universityLines) {
            lengthUniversity = universityLines.length;
        }
        var tempUniversityCode;
        var score = {};
        var goalItemList = [];
        if (req.session.goal && req.session.goal.items) {
            goalItemList = req.session.goal.items;
        }
        for (i = 0; i < lengthUniversity; i++) {
            var university = universityLines[i];
            var universityScore = {};
            universityScore.year = university.year;
            universityScore.studentType = university.student_type;
            universityScore.batch = university.batch;
            universityScore.maxScore = formatScore(university.max_score);
            universityScore.minScore = formatScore(university.min_score);
            universityScore.averageScore = formatScore(university.average_score);
            universityScore.admissionsNumber = university.admissions_number;
            universityScore.provinceLine = formatScore(university.score_line);
            universityScore.label = university.university_code + '_0_' + university.student_type;
            j = goalItemList.indexOf(universityScore.label);
            if (j >= 0) {
                universityScore.isGoal = true;
            }
            if (tempUniversityCode === university.university_code) {
                score.universityScore.push(universityScore);
                score.itemCount = score.itemCount + 1;
            } else {
                tempUniversityCode = university.university_code;
                score = {};
                score.universityCode = university.university_code;
                score.universityName = university.university_name;
                score.is985 = university.is_985;
                score.is211 = university.is_211;
                score.universityScore = [];
                score.universityScore.push(universityScore);
                score.itemCount = 1;
                scoreLine.push(score);
            }
        }
        if (majorLines) {
            lengthMajor = majorLines.length;
        }
        for (i = 0; i < lengthMajor; i++) {
            var major = majorLines[i];
            var majorScore = {};
            majorScore.majorCode = major.major_code;
            majorScore.majorName = major.major_name;
            majorScore.year = major.year;
            majorScore.studentType = major.student_type;
            majorScore.batch = major.batch;
            majorScore.maxScore = formatScore(major.max_score);
            majorScore.minScore = formatScore(major.min_score);
            majorScore.averageScore = formatScore(major.average_score);
            majorScore.admissionsNumber = major.admissions_number;
            majorScore.provinceLine = formatScore(major.score_line);
            majorScore.label = major.university_code + '_' + major.major_code + '_' + major.student_type;
            j = goalItemList.indexOf(majorScore.label);
            if (j >= 0) {
                majorScore.isGoal = true;
            }
            var isFound = false;
            for (j = 0; j < scoreLine.length; j++) {
                score = scoreLine[j];
                if (score.universityCode === major.university_code) {
                    if (!score.majorScore) {
                        score.majorScore = [];
                    }
                    score.majorScore.push(majorScore);
                    score.itemCount = score.itemCount + 1;
                    isFound = true;
                }
            }
            if (!isFound) {
                score = {};
                score.universityCode = major.university_code;
                score.universityName = major.university_name;
                score.is985 = major.is_985;
                score.is211 = major.is_211;
                score.majorScore = [];
                score.majorScore.push(majorScore);
                scoreLine.push(score);
                score.itemCount = 1;
            }
        }
        for (i = 0; i < scoreLine.length; i++) {
            score = scoreLine[i];
            if (score.majorScore) {
                score.majorScore[0].isFirstLine = true;
            } else if (score.universityScore) {
                score.universityScore[0].isFirstLine = true;
            }
        }

        if (scoreLine.length == 0) {
            isShowEmptyResult = true;
        }
    }

    res.render('setGoal', {
        location: studentLocs,
        type: types,
        majorClass: myMajorClasses,
        majorSubClass: subClasses,
        major: majors,
        universityLoc: universityLocs,
        university: myUniversities,
        scoreLine: scoreLine,
        isShowEmpty: isShowEmptyResult
    });
};

exports.changeGoal = function (req, res) {
    var item;
    var i;
    if (req.query.label) {
        item = req.query.label;
    } else {
        res.send('error');
        return;
    }

    if (!req.session.goal) {
        req.session.goal = {};
        req.session.goal.items = [];
    }
    if ('add' === req.query.action) {
        var i = req.session.goal.items.indexOf(item);
        if (i < 0) {
            req.session.goal.items.push(item);
        }
    }
    if ('del' === req.query.action) {
        i = req.session.goal.items.indexOf(item);
        if (i >= 0) {
            req.session.goal.items.splice(i, 1);
        }
    }
    req.session.goal.type1 = 0;
    req.session.goal.type2 = 0;
    req.session.goal.type3 = 0;
    for (i = 0; i < req.session.goal.items.length; i++) {
        item = req.session.goal.items[i];
        if (item.indexOf('文科') >= 0) {
            req.session.goal.type1 = req.session.goal.type1 + 1;
        }
        if (item.indexOf('理科') >= 0) {
            req.session.goal.type2 = req.session.goal.type2 + 1;
        }
        if (item.indexOf('综合') >= 0) {
            req.session.goal.type3 = req.session.goal.type3 + 1;
        }
    }
    res.send(req.session.goal.items.length.toString());
};

exports.resetGoal = function (req, res) {
    if (req.session.goal) {
        if (req.session.goal.items) {
            req.session.goal = {};
            req.session.goal.items = [];
            req.session.goal.type1 = 0;
            req.session.goal.type2 = 0;
            req.session.goal.type3 = 0;
            res.send('refresh');
            return;
        }
    }
    res.send('OK');
};


exports.doMatch = function (req, res) {

    console.log(req.session.goal);

    var studentLocs = [];
    var i, j;
    var temp;

    if (!req.session.usersetting) {
        req.session.usersetting = {};
        req.session.usersetting.sl = -1;
        req.session.usersetting.type = 0;
    }
    if (req.query.sl) {
        req.session.usersetting.sl = req.query.sl;
    }
    if (req.query.type || req.query.type == 0) {
        req.session.usersetting.type = req.query.type;
    }

    var locations = data.getLocations();
    var length = 0;
    if (locations) {
        length = locations.length;
    }
    for (i = 0; i < length; i++) {
        var location = locations[i];
        temp = {};
        temp.name = location.name;
        temp.code = location.code;
        if (temp.code == req.session.usersetting.sl) {
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
        studentLocs.push(temp);
    }
    var types = data.getStudentTypes();
    for (i = 0; i < types.length; i++) {
        temp = types[i];
        if (temp.code == req.session.usersetting.type) {
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
    }

    var goalMajors = [];
    var goalUniversities = [];
    var type = data.getTypeString(req.query.type);
    var universityGoalSize = 0;
    var majorGoalSize = 0;
    var matchedUniversityGoalSize = 0;
    var matchedMajorGoalSize = 0;
    var universityGoalCodeList = [];
    if (req.session.goal && req.session.goal.items) {
        for (i = 0; i < req.session.goal.items.length; i++) {
            var item = req.session.goal.items[i];
            var parts = item.split('_');
            var goal = {};
            if (parts[1] === '0') {
                // university goal
                goal.location = req.query.sl;
                goal.university = parts[0];
                goal.type = parts[2];
                universityGoalSize += 1;
                if (goal.type == type || type === '不限') {
                    matchedUniversityGoalSize += 1;
                    goalUniversities.push(goal);
                    universityGoalCodeList.push(goal.university);
                }
            } else {
                // major goal
                goal.location = req.query.sl;
                goal.university = parts[0];
                goal.major = parts[1];
                goal.type = parts[2];
                majorGoalSize += 1;
                if (goal.type == type || type === '不限') {
                    matchedMajorGoalSize += 1;
                    goalMajors.push(goal);
                }
            }
        }
    }

    var isShowEmptyResult = false;
    var goalList = [];

    if (req.query.sl && req.query.type) {
        var goalMajorList;
        var goalTemp;
        for (i = 0; i < goalMajors.length; i++) {
            temp = goalMajors[i];
            goalMajorList = data.getMajorGoal(temp.location, temp.university, temp.major, temp.type);
            console.log(goalMajorList);
            console.log(temp);
            for (j = 0; j < goalMajorList.length; j++) {
                goalTemp = {};
                goalTemp.isMajorGoal = true;
                goalTemp.universityName = goalMajorList[j].university_name;
                goalTemp.year = goalMajorList[j].year;
                goalTemp.majorName = goalMajorList[j].major_name;
                goalTemp.studentType = goalMajorList[j].student_type;
                goalTemp.batch = goalMajorList[j].batch;
                goalTemp.maxScore = formatScore(goalMajorList[j].max_score);
                goalTemp.minScore = formatScore(goalMajorList[j].min_score);
                goalTemp.averageScore = formatScore(goalMajorList[j].average_score);
                goalTemp.admissionsNumber = goalMajorList[j].admissions_number;
                goalTemp.provinceLine = formatScore(goalMajorList[j].score_line);
                if (j == 0) {
                    goalTemp.isFirstLine = true;
                }
                goalList.push(goalTemp);
            }
        }
        var goalUniversityList = data.getUniversityGoal(req.session.usersetting.sl, universityGoalCodeList, type);
        var lastUniversity, lastType;
        for (i = 0; i < goalUniversityList.length; i++) {
            goalTemp = {};
            goalTemp.isMajorGoal = false;
            goalTemp.universityName = goalUniversityList[i].university_name;
            goalTemp.year = goalUniversityList[i].year;
            goalTemp.studentType = goalUniversityList[i].student_type;
            goalTemp.batch = goalUniversityList[i].batch;
            goalTemp.maxScore = formatScore(goalUniversityList[i].max_score);
            goalTemp.minScore = formatScore(goalUniversityList[i].min_score);
            goalTemp.averageScore = formatScore(goalUniversityList[i].average_score);
            goalTemp.admissionsNumber = goalUniversityList[i].admissions_number;
            goalTemp.provinceLine = formatScore(goalUniversityList[i].score_line);
            if (lastUniversity != goalTemp.universityName || lastType != goalTemp.studentType) {
                goalTemp.isFirstLine = true;
                lastUniversity = goalTemp.universityName;
                lastType = goalTemp.studentType;
            }
            if (type == '不限') {
                for (j = 0; j < goalUniversities.length; j++) {
                    if (goalUniversityList[i].university_code == goalUniversities[j].university
                        && goalTemp.studentType == goalUniversities[j].type) {
                        goalList.push(goalTemp);
                        continue;
                    }
                }
            } else {
                goalList.push(goalTemp);
            }
        }

        if (goalList.length == 0) {
            isShowEmptyResult = true;
        }
    }

    res.render('doMatch', {
        isShowEmpty: isShowEmptyResult,
        location: studentLocs,
        type: types,
        goalList: goalList,
        universityGoalSize: universityGoalSize,
        majorGoalSize: majorGoalSize,
        matchedUniversityGoalSize: matchedUniversityGoalSize,
        matchedMajorGoalSize: matchedMajorGoalSize,
    });
};