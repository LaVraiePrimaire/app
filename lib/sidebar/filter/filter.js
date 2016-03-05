import ToggleParent from 'democracyos-toggle-parent';
import view from '../../view/mixin';
import template from './template.jade';
import candidateFilter from '../../candidate-filter/candidate-filter';

export default class Filter extends view('appendable', 'removeable', 'withEvents') {
  constructor (options) {
    options.template = template;
    options.locals = options.filter;
    super(options);

    this.filter = this.options.filter;

    this.onHideVotedClick = this.onHideVotedClick.bind(this);
    this.onSortClick = this.onSortClick.bind(this);

    this.switchOn();
  }

  switchOn () {
    this.bind('click', '[data-hide-voted]', this.onHideVotedClick);
    this.bind('click', '[data-status]', this.onStatusClick);
    this.bind('click', '[data-sort]', this.onSortClick);

    var dropdownBtn = this.el.querySelector('[data-sort-btn]');
    this.filterDropdown = new ToggleParent(dropdownBtn);
  }

  onHideVotedClick (e) {
    candidateFilter.setFilter({ hideVoted: e.delegateTarget.checked });
  }

  onSortClick (e) {
    e.preventDefault();
    let el = e.delegateTarget;
    let sort = el.getAttribute('data-sort');
    if (this.filter.sort === sort) return;
    candidateFilter.setFilter({ sort: sort });
  }
}
