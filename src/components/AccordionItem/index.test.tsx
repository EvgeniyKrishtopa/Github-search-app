import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { rootReducer } from 'store/reducers';
import AccordionItem from './index';
import { ISession } from 'typings/interfaces';

const renderItem = (session: ISession) => {
  const store = createStore(rootReducer, applyMiddleware(thunk));
  return render(
    <Provider store={store}>
      <AccordionItem {...session} />
    </Provider>,
  );
};

describe('AccordionItem', () => {
  it('shows the empty message when there are no repositories', () => {
    const { getByText } = renderItem({
      data: [],
      id: 1,
      opened: false,
      request: 'react',
    });
    expect(
      getByText('This request does not have any repos!'),
    ).toBeInTheDocument();
  });

  it('renders each repository name linking to its GitHub URL', () => {
    const data = [
      { id: 1, name: 'react', html_url: 'https://github.com/facebook/react' },
      { id: 2, name: 'redux', html_url: 'https://github.com/reduxjs/redux' },
    ];
    const { getByText } = renderItem({
      data,
      id: 1,
      opened: false,
      request: 'search-query',
    });

    const reactLink = getByText('react').closest('a');
    expect(reactLink).toHaveAttribute(
      'href',
      'https://github.com/facebook/react',
    );

    const reduxLink = getByText('redux').closest('a');
    expect(reduxLink).toHaveAttribute(
      'href',
      'https://github.com/reduxjs/redux',
    );
  });
});
