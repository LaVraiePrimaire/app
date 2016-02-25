import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';

const voteOptions = ['negative', 'positive', 'neutral'];

class TopicStore extends Store {
  name () {
    return 'topic';
  }

  parse (topic) {

    return Promise.resolve().then(function () {
      topic.url = '/topic/' + topic.id;
      return topic;
    });
  }

  publish (id) {
    if (!this.item.get(id)) {
      return Promise.reject(new Error('Cannot publish not fetched item.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/publish`)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(id, item);
            resolve(item);
          });
        });
    });

    return promise;
  }

  unpublish (id) {
    if (!this.item.get(id)) {
      return Promise.reject(new Error('Cannot unpublish not fetched item.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/unpublish`)
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(id, item);
            resolve(item);
          });
        });
    });

    return promise;
  }

  vote (id, value) {
    if (!this.item.get(id)) {
      return Promise.reject(new Error('Cannot vote not fetched item.'));
    }

    if (!~voteOptions.indexOf(value)) {
      return Promise.reject(new Error('Invalid vote value.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/vote`)
        .send({ value: value })
        .end((err, res) => {
          if (err || !res.ok) return reject(err);

          this.parse(res.body).then(item => {
            this.set(id, item);
            resolve(item);
          });
        });
    });

    return promise;
  }
}

export default new TopicStore;
