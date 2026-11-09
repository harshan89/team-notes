import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  title: string;

  @Column("text", { default: "" })
  content: string;

  @Column("varchar")
  teamId: string;

  @CreateDateColumn()
  createdAt: Date;
}
