"use strict";

const Discussion = require("../models/Discussion"); // Discussion 모델 요청

const getDiscussionParams = (body, user) => {
  return {
    title: body.title,
    description: body.description,
    author: user,
    category: body.category,
    tags: body.tags,
  };
};

module.exports = {
  // 1. new 액션
  new: (req, res) => {
    res.render("discussions/new", {
      page: "new-discussion",
      title: "New Discussion",
    });
  },

  // 2. create 액션
  create: (req, res, next) => {
    if (req.skip) return next(); // 유효성 체크를 통과하지 못하면 다음 미들웨어 함수로 전달

    let discussionParams = getDiscussionParams(req.body, req.user); // Discussion 파라미터 생성

    Discussion.create(discussionParams)
      .then((discussion) => {
        res.locals.redirect = `/discussions/${discussion._id}`; // 생성된 토론의 페이지로 리디렉션 설정
        res.locals.discussion = discussion;
        next();
      })
      .catch((error) => {
        console.log(`Error creating discussion: ${error.message}`);
        next(error); // 에러를 캐치하고 다음 미들웨어로 전달
      });
  },

  // redirectView 액션
  redirectView: (req, res, next) => {
    let redirectPath = res.locals.redirect;
    if (redirectPath) res.redirect(redirectPath);
    else next();
  },

  // index 액션
  index: (req, res, next) => {
    Discussion.find()
      .populate("author")
      .exec()
      .then((discussions) => {
        res.locals.discussions = discussions; // 응답상에서 토론 데이터를 저장하고 다음 미들웨어 함수 호출
        next();
      })
      .catch((error) => {
        console.log(`Error fetching discussions: ${error.message}`);
        next(error); // 에러를 캐치하고 다음 미들웨어로 전달
      });
  },

  indexView: (req, res) => {
    res.render("discussions/index", {
      page: "discussions",
      title: "All Discussions",
      discussions: res.locals.discussions,
    }); // 분리된 액션으로 뷰 렌더링
  },

  // show 액션
  show: (req, res, next) => {
    let discussionId = req.params.id; // request params로부터 토론 ID 수집
    Discussion.findById(discussionId)
      .populate("author")
      .populate("comments")
      .exec()
      .then((discussion) => {
        discussion.views++;
        discussion.save().then(() => {
          res.locals.discussion = discussion;
          next();
        });
      })
      .catch((error) => {
        console.log(`Error fetching discussion by ID: ${error.message}`);
        next(error); // 에러를 로깅하고 다음 함수로 전달
      });
  },

  showView: (req, res) => {
    res.render("discussions/show", {
      page: "discussion-details",
      title: "Discussion Details",
      discussion: res.locals.discussion,
    });
  },

  // edit 액션
  edit: (req, res, next) => {
    let discussionId = req.params.id;
    Discussion.findById(discussionId)
      .populate("author")
      .populate("comments")
      .exec()
      .then((discussion) => {
        res.render("discussions/edit", {
          discussion: discussion,
          page: "edit-discussion",
          title: "Edit Discussion",
        }); // 데이터베이스에서 내 특정 토론을 위한 편집 페이지 렌더링
      })
      .catch((error) => {
        console.log(`Error fetching discussion by ID: ${error.message}`);
        next(error);
      });
  },

  // update 액션
  update: (req, res, next) => {
    let discussionId = req.params.id;
    let discussionParams = getDiscussionParams(req.body, req.user);

    Discussion.findByIdAndUpdate(discussionId, {
      $set: discussionParams,
    })
      .exec() // ID로 토론을 찾아 단일 명령으로 레코드를 수정하기 위한 findByIdAndUpdate의 사용
      .then((discussion) => {
        res.locals.redirect = `/discussions/${discussionId}`;
        res.locals.discussion = discussion;
        next(); // 지역 변수로서 응답하기 위해 토론을 추가하고 다음 미들웨어 함수 호출
      })
      .catch((error) => {
        console.log(`Error updating discussion by ID: ${error.message}`);
        next(error);
      });
  },

  // delete 액션
  delete: (req, res, next) => {
    let discussionId = req.params.id;
    Discussion.findByIdAndRemove(discussionId) // findByIdAndRemove 메소드를 이용한 토론 삭제
      .then(() => {
        res.locals.redirect = "/discussions";
        next();
      })
      .catch((error) => {
        console.log(`Error deleting discussion by ID: ${error.message}`);
        next(error);
      });
  },
};
