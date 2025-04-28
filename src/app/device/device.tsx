import React from 'react';
import styles from './device.module.css';
import clsx from 'clsx';

export interface DeviceProps extends React.ComponentPropsWithoutRef<'li'> {
    active: boolean;
    distance?: React.ReactElement;
    selected?: boolean;
}

const Device = ({
    className,
    children,
    active,
    distance,
    selected,
    ...rest
}: DeviceProps): React.ReactElement => {
    return (
        <li
            {...rest}
            role={'button'}
            className={clsx(
                styles.device,
                active && styles.active,
                selected && styles.selected,
                className
            )}
        >
            {children}
            {distance && <span className={styles.distance}>{distance}</span>}
            <span data-active={String(active)} className={styles.indicator} />
        </li>
    );
};

export default Device;
