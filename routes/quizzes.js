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
  userExistsByID,
  urlsForUser,
} = require("../helpers.js");

const { getPublicQuizID, getAllPublicQuiz, getPrivateQuizID, getAllPrivateQuiz, getUserByName, addPrivateQuiz, addUserAnswer } = require("../database.js");
const { Pool } = require('pg/lib');
const { user } = require('pg/lib/defaults');

//=============GLOBAL OBJECTS================//

// const quizDB = res.rows
// const userDB =


module.exports = (db) => {

  // ================== GET ==================== //

  router.get("/", (req, res) => {
    const user_name = req.session.user_name;
    // const user =
    getUserByName(user_name)
      .then((user) => {
        // res.cookie('user_id', user.id);
        getAllPublicQuiz()
          .then((quizzes) => { // quiz == res.rows
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
  });

  router.get("/private", (req, res) => {
    const user_name = req.session.user_name;
    getUserByName(user_name)
      .then((user) => {
        getAllPrivateQuiz(user.id)
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
      });
  });

  router.get("/create", (req, res) => {
    console.log("ROUTER/GET/CREATE");
    const user_name = req.session.user_name;
    getUserByName(user_name)
      .then((user) => {
        const templateVars = {
          user
        };
        res.render("quiz_create", templateVars);
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  router.get("/result", (req, res) => {
    console.log('ROUTER/GET/RESULT');
    const user_name = req.session.user_name;
    // console.log(user_name);
    getUserByName(user_name)
      .then((user) => {
        const templateVars = {
          user
        };
        res.render("quiz_result", templateVars);
      });
  });

  // handling individual quiz page
  router.get("/:quizID", (req, res) => {
    console.log("NOOO");
    const quizID = req.params.quizID;
    const user_name = req.session.user_name;
    getUserByName(user_name)
      .then((user) => {
        if (quizID <= 17) {
          console.log("is_quisID", quizID);
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
        } else {
          getPrivateQuizID(quizID)
            .then((quiz) => {
              // console.log(quiz); //promise is coming up as undefined
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

        }
      });
  });

  router.get("/create", (req, res) => {
    const user_name = req.session.user_name;
    getUserByName(user_name)
      .then((user) => {
        const templateVars = {
          user
        };
        res.render("quiz_create", templateVars);
      });
  });

  // ================== POST ==================== //

  router.post("/create", (req, res) => {
    console.log(req.body, req.session.user_id);
    const question = req.body.questionInput;
    const answer = req.body.answerInput;
    const user_id = req.session.user_id;
    // console.log('body is', question, answer)
    addPrivateQuiz({ question, answer, user_id })
      .then((quiz) => {
        // res.send(quiz);
        res.redirect('/quizzes/private');
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  // router.post("/check", (req, res) => {
  router.post("/check", (req, res) => {
    const { userAnswer, quizID } = req.body;
    console.log('quiz', quizID);

    getPublicQuizID(quizID)
      .then((quiz) => {
        console.log(quiz);
        // const oneQuestion = quiz[0].question;
        // const oneQuiz = quiz[0];
        const oneAnswer = quiz[0].answer;
        return oneAnswer.toLowerCase() === userAnswer.toLowerCase(); //returns true or false
      })
      .then((trueOrFalse) => {
        addUserAnswer(userAnswer)// userAnswer = obj
          .then(() => {
            const templateVars = {
              user: null
            }
            res.send(trueOrFalse);
            // res.send("quiz_result", templateVars);
          })
          .catch((err) => {
            console.log(err)
            res.send('error addUserAnswer', err)
          })
        // res.send(trueOrFalse); //returns true or false
      })
      .catch((err) => {
        console.log("err ", err);
        res.send('error getPublicQuiz', err)
      });
  });

  // getPublicQuizID(quizID)
  //   .then((quiz) => {
  //     const oneAnswer = quiz[0].answer;
  //     res.send(oneAnswer.toLowerCase() === userAnswer.toLowerCase()); //returns true or false
  //   });


  // const { userAnswer, quizID } = req.body;
  // console.log('TEST', req.body)
  // console.log('user is ', userAnswer)
  // console.log('req.body', quizID)

  // getPublicQuizID(quizID)
  // .then((quiz) => {
  // const oneAnswer = quiz[0].answer;

  // const templateVars = {
  //   user,
  //   oneQuiz: oneQuiz,
  //   oneQuestion: oneQuestion,
  //   oneAnswer: oneAnswer,
  // };


  // console.log('test', quizID)


  // ================== GARY ==================== //

  router.get("/", (req, res) => {
    res.render("quizzes");


    res.render("quizzes", {}); //templateVars

    let query = `SELECT * FROM quizzes`;
    // console.log(query);
    db.query(query)
      .then(data => {
        const quizzes = data.rows;
        ///template vars and render instead of res.render
        // res.render("", {res.row})
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });
  return router;
};

