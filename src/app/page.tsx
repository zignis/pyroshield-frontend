import styles from './page.module.css';
import Device from '@/app/device';
import Divider from '@/app/divider';
import Stat from '@/app/stat';

export default function Home() {
    return (
        <main className={styles.main}>
            <section className={styles.left}>
                <div className={styles.statContainer}>
                    <Stat heading={'Test'}>100</Stat>
                    <Stat heading={'Test'}>100</Stat>
                    <Stat heading={'Test'}>100</Stat>
                    <Stat heading={'Test'}>100</Stat>
                    <Stat heading={'Test'}>100</Stat>
                    <Stat heading={'Test'}>100</Stat>
                </div>
                <Divider layout={'horizontal'} />
                <div>
                    <h4
                        style={{
                            marginBottom: '16px',
                            marginTop: '-8px',
                            fontWeight: '600',
                        }}
                    >
                        Nearby devices
                    </h4>
                    <ul className={styles.deviceList}>
                        <Device
                            active={true}
                            selected
                            distance={<>5 km away</>}
                        >
                            Device 1
                        </Device>
                        <Device active={true} distance={<>5 km away</>}>
                            Device 2
                        </Device>
                        <Device active={true} distance={<>5 km away</>}>
                            Device 3
                        </Device>
                        <Device active={false} distance={<>5 km away</>}>
                            Device 4
                        </Device>
                        <Device active={false} distance={<>5 km away</>}>
                            Device 5
                        </Device>
                    </ul>
                </div>
            </section>
            <Divider layout={'vertical'} />
            <section className={styles.right}>RIGHT</section>
        </main>
    );
}
