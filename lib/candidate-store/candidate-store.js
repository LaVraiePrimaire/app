import Store from '../store/store';
import request from '../request/request';
import config from '../config/config';

class CandidateStore extends Store {
  name () {
    return 'candidate';
  }

  parse (candidate) {
    return Promise.resolve().then(function () {
      candidate.url = '/candidate/' + candidate.id;
      return candidate;
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

  acceptNomination (id) {
    if (!this.item.get(id)) {
      return Promise.reject(new Error('Cannot accept nomination of not fetched item.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/acceptNomination`)
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

  vote (id) {
    if (!this.item.get(id)) {
      return Promise.reject(new Error('Cannot vote not fetched item.'));
    }

    let promise = new Promise((resolve, reject) => {
      request
        .post(`${this.url(id)}/vote`)
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

export default new CandidateStore;
