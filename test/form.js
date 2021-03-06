'use strict';
/* eslint-disable no-new */

var Form = require('../index');

function triggerEvent(name, target) {
  var event;

  target = target || global;
  event = document.createEvent('Event');

  event.preventDefault = sinon.spy();
  event.initEvent(name, true, true);
  target.dispatchEvent(event);
  return event;
}

describe('Form', function () {
  beforeEach(function () {
    this.htmlForm = document.createElement('form');
    this.htmlForm.id = 'fakeform';
    document.body.appendChild(this.htmlForm);
    this.form = new Form('fakeform');
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('constructor', function () {
    it('assigns this.htmlForm to the form with the supplied id', function () {
      expect(this.form.htmlForm).to.equal(this.htmlForm);
    });

    it('assigns this.htmlForm if passed an HTMLFormElement', function () {
      var form = document.createElement('form');
      var napped = new Form(form);

      expect(napped.htmlForm).to.equal(form);
    });

    it('throws errors when passed non-form elements', function () {
      var div = document.createElement('div');

      expect(function () {
        new Form(div);
      }).to.throw(TypeError);
    });

    it('throws errors when passed a non-form ID', function () {
      var div = document.createElement('div');

      div.id = 'yas';
      document.body.appendChild(div);

      expect(function () {
        new Form(div);
      }).to.throw(TypeError);
    });

    it('throws errors when passed a non-existent ID', function () {
      expect(function () {
        new Form('oh-yeah-its-the-form-napper');
      }).to.throw(TypeError);
    });
  });

  describe('hijack', function () {
    it('assigns a handler to the form', function () {
      var spy = this.sandbox.spy();

      this.sandbox.spy(this.form.htmlForm, 'addEventListener');

      this.form.hijack(spy);

      expect(this.form.htmlForm.addEventListener).to.have.been.called;
      expect(this.form.htmlForm.addEventListener).to.be.calledWith('submit');
    });

    it('prevents default on the submit event', function () {
      var event;
      var spy = this.sandbox.spy();

      this.sandbox.spy(this.form.htmlForm, 'addEventListener');

      this.form.hijack(spy);
      event = triggerEvent('submit', this.form.htmlForm);

      expect(event.preventDefault).to.have.been.called;
    });

    it('calls handler on form submit', function () {
      var spy = this.sandbox.spy();

      this.sandbox.spy(this.form.htmlForm, 'addEventListener');

      this.form.hijack(spy);
      triggerEvent('submit', this.form.htmlForm);

      expect(spy).to.have.been.called;
    });

    it('noops when calling thing a second time', function () {
      this.form.hijack(function () {});

      this.sandbox.spy(this.form.htmlForm, 'addEventListener');

      this.form.hijack(function () {});

      expect(this.form.htmlForm.addEventListener).not.to.have.been.called;
    });
  });

  describe('inject', function () {
    it('modifies existing input values', function () {
      var actualInput;
      var expectedInput = document.createElement('input');

      expectedInput.name = 'foo';
      expectedInput.value = 'bar';
      this.htmlForm.appendChild(expectedInput);

      this.form.inject('foo', 'baz');
      actualInput = document.querySelector('input[name="foo"]');

      expect(actualInput.value).to.equal('baz');
    });

    it('appends hidden input for nonexistent input name', function () {
      var input;

      this.form.inject('foo', 'bar');
      input = document.querySelector('input[name="foo"]');

      expect(input).to.exist;
      expect(input.type).to.equal('hidden');
    });

    it('returns the existing input element', function () {
      var existingInput = document.createElement('input');

      existingInput.name = 'foo';
      this.htmlForm.appendChild(existingInput);

      expect(this.form.inject('foo', 'baz')).to.equal(existingInput);
    });

    it('returns a newly-added input', function () {
      var result = this.form.inject('foo', 'bar');
      var newInput = document.querySelector('input[name="foo"]');

      expect(result).to.equal(newInput);
    });
  });

  describe('submit', function () {
    it('calls the original form submit', function () {
      var stub = this.sandbox.stub(this.form.htmlForm, 'submit');
      var prototypeStub = this.sandbox.stub(HTMLFormElement.prototype.submit, 'call');

      this.form.submit();

      expect(stub).not.to.have.been.called;
      expect(prototypeStub).to.have.been.called;
    });
  });

  describe('detach', function () {
    it('calls removeEventListener', function () {
      this.sandbox.spy(this.form.htmlForm, 'removeEventListener');

      this.form.submitHandler = 'fakeHandler';
      this.form.detach();

      expect(this.form.htmlForm.removeEventListener).to.have.been.called;
      expect(this.form.htmlForm.removeEventListener).to.be.calledWith('submit', 'fakeHandler', false);
    });

    it('deletes the submitHandler', function () {
      this.form.submitHandler = 'fakeHandler';
      this.form.detach();

      expect(this.form.submitHandler).to.equal(undefined); // eslint-disable-line no-undefined
    });
  });
});
