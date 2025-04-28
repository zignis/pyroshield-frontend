import styles from './divider.module.css';
import React from 'react';
import clsx from 'clsx';

export interface DividerProps extends React.ComponentPropsWithoutRef<'span'> {
    layout: 'vertical' | 'horizontal';
}

const Divider = ({ className, layout, ...rest }: DividerProps) => {
    return (
        <span
            {...rest}
            className={clsx(styles.divider, className)}
            data-layout={layout}
        />
    );
};

export default Divider;
