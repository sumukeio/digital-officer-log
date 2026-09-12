import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StructuredEditor } from '@/components/headline-brief/StructuredEditor';
import { createEmptyModule } from '@/lib/headline-brief/types';

describe('StructuredEditor', () => {
  it('应渲染问题/改善/收益分区并可添加问题', () => {
    const onChange = jest.fn();
    const module = createEmptyModule('production');

    render(<StructuredEditor module={module} onChange={onChange} />);

    expect(screen.getByText('一、问题')).toBeInTheDocument();
    expect(screen.getByText('二、改善')).toBeInTheDocument();
    expect(screen.getByText('三、收益')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /添加问题/ }));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0];
    expect(next.problems).toHaveLength(1);
  });
});
