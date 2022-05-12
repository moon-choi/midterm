/* eslint-disable camelcase */
/*
 * All routes for Widgets are defined here
 * Since this file is loaded in server.js into api/widgets,
 *   these routes are mounted onto /widgets
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();

//answers route too

const {
  generateRandomString,
  urlsForUser,
} = require("../helpers.js");
const { correctAnswer, getPublicQuizID, getAllPublicQuiz, getPrivateQuizID, getAllPrivateQuiz, getUserByName, addPrivateQuiz, addUserAnswer, wrongAnswer, totalAttempts, getLatestHistory, hadAttempted } = require("../database.js");
const { Pool } = require('pg/lib');

module.exports = (db) => {

  // ================== GET ==================== //

  router.get("/", (req, res) => {
    let user_name = req.session.user_name;
    let user_id = req.session.user_id;
    if (user_id === undefined) {
      user_name = 'visitor',
        user_id = 1;
    }
    const user = { user_name, user_id };
    /**
     * if every user use the same name,
     * 
     */


    getAllPublicQuiz()
      .then((quizzes) => { // quizzes == res.rows
        const templateVars = {
          user,
          quizzes
        };
        res.render('quizzes', templateVars);
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  router.get("/private", (req, res) => {
    const user_name = req.session.user_name;
    const user_id = req.session.user_id;
    const user = { user_name, user_id };
    getAllPrivateQuiz(user_id)
      .then((obj) => { // quizzes == res.rows [{quiz}, {quiz}, {quiz}, {} ] arr[0]
        const templateVars = {
          user,
          obj
        };
        res.render("quiz_private", templateVars);
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
    // });
  });

  router.get("/create", (req, res) => {
    console.log("ROUTER/GET/CREATE");
    const user_name = req.session.user_name;
    const user_id = req.session.user_id;
    const user = { user_name, user_id };
    const templateVars = {
      user
    };
    res.render("quiz_create", templateVars);
    // })
    // .catch((e) => {
    //   console.error(e);
    //   res.send(e);
    // });
  });


  router.get("/result", (req, res) => {
    console.log('ROUTER/GET/RESULT');
    let user_name = req.session.user_name;
    let user_id = req.session.user_id;
    if (user_id === undefined) {
      user_name = 'visitor',// randomStr()
        user_id;
    }
    console.log('user_id', user_id);
    console.log('user_name', user_name);

    const user = { user_name, user_id };

    Promise.all([
      correctAnswer(user_id), wrongAnswer(user_id), totalAttempts(user_id), getLatestHistory(user_id)
    ])
      .then((nums) => {

        console.log("nums", nums);
        const templateVars = {
          nums,
          user
        };
        res.render("quiz_result", templateVars);
      });
  });

  router.get("/quizzes/:randomString", (req, res) => {
    const randomString = req.params.randomString;
    let user_name = req.session.user_name;
    let user_id = req.session.user_id;
    if (user_id === undefined) {
      user_name = 'visitor',
        user_id = 1;
    }
    const user = { user_name, user_id };

    getPrivateQuizID(randomString) // a1b2c3
      .then((quiz) => {
        const oneQuiz = quiz[0];
        const oneQuestion = quiz[0].question;
        const oneAnswer = quiz[0].answer;
        const oneString = quiz[0].random_string;

        const templateVars = {
          user,
          oneQuiz: oneQuiz,
          oneQuestion: oneQuestion,
          oneAnswer: oneAnswer,
          oneString: oneString
        };
        res.render("quiz_show_private", templateVars);
      })
      .catch((error) => {
        console.log(error);
      });
  });

  // get/quizzes/:quizID <- this is our RESTful route
  //  post/quizzes/:quizID/results
  // handling individual quiz page
  router.get("/:quizID", (req, res) => {
    const quizID = req.params.quizID;
    let user_name = req.session.user_name;
    let user_id = req.session.user_id;
    if (user_id === undefined) {
      user_name = 'visitor',
        user_id = 1;
    }
    const user = { user_name, user_id };
    console.log("req.params", req.params);
    console.log("is_quizID", quizID); //WHY IS THIS UNDEFINED?
    getPublicQuizID(quizID)
      .then((quiz) => {
        const oneQuiz = quiz[0];
        const oneQuestion = quiz[0].question;
        const oneAnswer = quiz[0].answer;

        const templateVars = {
          user,
          oneQuiz: oneQuiz,
          oneQuestion: oneQuestion,
          oneAnswer: oneAnswer,
        };
        res.render("quiz_show", templateVars);
      })
      .catch((error) => {
        console.log(error);
      });
    // };
  });


  // ================== POST ==================== //

  router.post("/create", (req, res) => { //LOGED IN USER ONLY.
    console.log(req.body, req.session.user_id);
    const question = req.body.questionInput;
    const answer = req.body.answerInput;
    const user_id = req.session.user_id;
    // console.log('body is', question, answer)
    const random_string = generateRandomString(); //returns string 'x1y2z3'
    addPrivateQuiz({ question, answer, user_id, random_string }) // finish inserting
      .then(() => {
        res.redirect('/quizzes/private'); // list of private quizzes
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  router.post("/check", (req, res) => {
    const { quizID, private } = req.body;
    // console.log("REQ.BODY", req.body);
    const userAnswer = req.body.userAnswer; //it's a string.
    // console.log('check-quiz why is this undefined?', quizID);// ok
    // const quizID = req.params.quizID;
    // console.log("TEST", quizID); // ok
    let user_name = req.session.user_name;
    console.log('user_name is', user_name);
    let user_id = req.session.user_id;
    console.log('user_id is', user_id);
    if (user_id === undefined) {
      user_name = 'visitor',
        user_id = 1;
    }
    console.log('user_name is', user_name);
    console.log('user_id is', user_id);

    const user = { user_name, user_id };

    // answer check first
    
    if (private === 'true') {
      getPrivateQuizID(quizID)
      .then((quiz) => {
        // console.log("USER ID ", user_id);
        // console.log("quiz0", quiz[0]);
        // console.log("UA", userAnswer);
        // const nextUUID = quiz[0].randomString;
        const oneAnswer = quiz[0].answer;
        const currentQuizID = quiz[0].id;// 16
        const trueOrFalseResult = oneAnswer.toLowerCase() === userAnswer.toLowerCase(); // true
        const trueOrFalse = {trueOrFalseResult, currentQuizID}
          hadAttempted(quiz[0])
            .then((hasHistory) => {
              if (hasHistory) {
                console.log(currentQuizID)
                return res.send(trueOrFalse)
              } else if (hasHistory !== true) {
                addUserAnswer(user_id, quiz[0], userAnswer)
                  .then(() => res.send(trueOrFalse))
                  .catch((err) => {
                    console.log('private_addUserAnswer catch', err)
                  })
              }
            })
            .then((err) => {
              console.log('private_hadAttempted catch', err)
            })
        })
    } else {
      console.log('ddddddddddddd', quizID)
      getPublicQuizID(quizID)
      .then((quiz) => {
        // const nextUUID = quiz[0].randomString;
        const oneAnswer = quiz[0].answer;
        const currentQuizID = quiz[0].id;// 16
        const trueOrFalseResult = oneAnswer.toLowerCase() === userAnswer.toLowerCase(); // true
        const trueOrFalse = {trueOrFalseResult, currentQuizID}
        console.log('quiquiquiz', quiz)
        hadAttempted(quiz[0])
          .then((hasHistory) => {
            if (hasHistory === true) {
              console.log(currentQuizID)
              return res.send(trueOrFalse)
            } else if (hasHistory !== true) {
              addUserAnswer(user_id, quiz[0], userAnswer)
                .then(() => res.send(trueOrFalse))
                .catch((err) => {
                  console.log('public_addUserAnswer catch', err)
                })
            }
          })
          .catch((err) => {
            console.log('public_hadAttempted catch', err)
          })
      })

    }
  });
  return router;
}