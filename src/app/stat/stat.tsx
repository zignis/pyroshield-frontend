import React from 'react';
import clsx from 'clsx';
import styles from './stat.module.css';

export interface StatProps extends React.ComponentPropsWithoutRef<'div'> {
    heading: string;
}

const Stat = ({
    className,
    children,
    heading,
    ...rest
}: StatProps): React.ReactElement => {
    return (
        <div {...rest} className={clsx(styles.stat, className)}>
            <span className={clsx(styles.heading)}>{heading}</span>
            <span className={clsx(styles.value)}>{children}</span>
        </div>
    );
};

export default Stat;
